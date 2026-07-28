import { EstadoAtencion } from '../generated/prisma/enums';
import { MOTIVOS, SOLUCIONES } from '../fibex-play/gestion/catalogos';
import { diaLocal } from './dia';

/** Fila exacta de `createMany` de una atención (sirve para seed y tests). */
export interface AtencionSeed {
  id: string;
  operadorId: string;
  abonado: string;
  canal: string;
  motivo: string;
  solucion: string;
  estado: EstadoAtencion;
  creadoEn: Date;
}

/** Primera atención: 12:00 UTC = 08:00 en Venezuela. */
const INICIO_UTC = 'T12:00:00.000Z';
/** Separación entre atenciones (20 min) → 24 instantes distintos y orden estable. */
const CADENCIA_MS = 20 * 60 * 1000;

/**
 * Ranking de canales (desc, ESPN top): 6·5·4·3·3·3 = 24. Alimenta "Top Canales".
 */
const CANAL_REPARTO: readonly [string, number][] = [
  ['ESPN', 6],
  ['Cartoon Network', 5],
  ['HBO Max', 4],
  ['Discovery', 3],
  ['CNN Español', 3],
  ['Fox Sports', 3],
];

/** Estados: 16 SOLUCIONADO · 5 EN_PROCESO · 3 ESCALADO (KPIs del spec §2.3). */
const ESTADO_REPARTO: readonly [EstadoAtencion, number][] = [
  ['SOLUCIONADO', 16],
  ['EN_PROCESO', 5],
  ['ESCALADO', 3],
];

const ABONADOS = [
  'Cond. Los Robles',
  'Torre Aurora',
  'Res. El Mirador',
  'Plaza Central',
  'Barrio San Luis',
  'Av. Bolívar Norte',
  'Urb. La Granja',
  'Cuenta 100482',
];

/** Expande `[valor, veces][]` en una lista plana determinista. */
function expandir<T>(reparto: readonly [T, number][]): T[] {
  return reparto.flatMap(([valor, veces]) =>
    Array.from({ length: veces }, () => valor),
  );
}

/**
 * Construye las 24 atenciones demo, deterministas e idempotentes (ids fijos
 * `atencion-0001`…). Canales con ranking desc (ESPN top), estados 16/5/3 y
 * motivos que recorren las 4 categorías de origen. `creadoEn` se reparte por la
 * jornada laboral del DÍA DE HOY (12:00–19:40 UTC ≈ 08:00–15:40 en Venezuela),
 * a partir de `hoy` —nunca una fecha literal— para que Fibex Play · Gestión
 * muestre actividad al abrirlo. Dentro de un mismo día es reproducible.
 */
export function construirAtenciones(
  operadorIds: readonly string[],
  hoy: Date = new Date(),
): AtencionSeed[] {
  const canales = expandir(CANAL_REPARTO); // 24
  const estados = expandir(ESTADO_REPARTO); // 24
  const inicio = new Date(`${diaLocal(hoy)}${INICIO_UTC}`).getTime();

  return canales.map((canal, i) => ({
    id: `atencion-${String(i + 1).padStart(4, '0')}`,
    operadorId: operadorIds[i % operadorIds.length],
    abonado: ABONADOS[i % ABONADOS.length],
    canal,
    // Recorre los 10 motivos → cubre las 4 categorías de origen con ≥1 cada una.
    motivo: MOTIVOS[i % MOTIVOS.length],
    solucion: SOLUCIONES[i % SOLUCIONES.length],
    estado: estados[i],
    creadoEn: new Date(inicio + i * CADENCIA_MS),
  }));
}

/** Contrato mínimo de Prisma que necesita el sembrado (facilita el test unitario). */
export interface AtencionCreateManyClient {
  atencionApp: {
    createMany(args: {
      data: AtencionSeed[];
      skipDuplicates?: boolean;
    }): Promise<{ count: number }>;
    updateMany(args: {
      where: { id: string };
      data: { creadoEn: Date };
    }): Promise<{ count: number }>;
  };
}

/**
 * Idempotente: `createMany` con `skipDuplicates` sobre ids deterministas y, a
 * continuación, refresco de `creadoEn` al día de hoy. El refresco es necesario
 * porque `skipDuplicates` NO actualiza las filas ya existentes: sin él, la
 * bitácora se quedaría congelada en el día del primer seed.
 */
export async function sembrarAtenciones(
  prisma: AtencionCreateManyClient,
  operadorIds: readonly string[],
  hoy: Date = new Date(),
): Promise<{ count: number; actualizadas: number }> {
  const filas = construirAtenciones(operadorIds, hoy);
  const { count } = await prisma.atencionApp.createMany({
    data: filas,
    skipDuplicates: true,
  });

  let actualizadas = 0;
  for (const fila of filas) {
    const { count: n } = await prisma.atencionApp.updateMany({
      where: { id: fila.id },
      data: { creadoEn: fila.creadoEn },
    });
    actualizadas += n;
  }

  return { count, actualizadas };
}
