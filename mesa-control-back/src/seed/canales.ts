import {
  CategoriaCanal,
  EstadoCanal,
  SeveridadIncidencia,
  TipoIncidencia,
} from '../generated/prisma/enums';

/** Total de canales de la grilla (coincide con el diseño). */
export const TOTAL_CANALES = 165;

/** Día base determinista de las caídas (mismo que el ejemplo del spec). */
const FECHA_BASE = '2026-07-22';

/** Fila exacta de `createMany` de un canal: sirve tanto para el seed como para los tests. */
export interface CanalSeed {
  id: string;
  nombre: string;
  categoria: CategoriaCanal;
  estado: EstadoCanal;
  tipoIncidencia: TipoIncidencia | null;
  severidad: SeveridadIncidencia | null;
  detectadoEn: Date | null;
  orden: number;
}

/** Los 6 caídos por defecto, con los datos EXACTOS de la tabla del spec (§2.2). */
interface CaidoSpec {
  nombre: string;
  categoria: CategoriaCanal;
  tipoIncidencia: TipoIncidencia;
  severidad: SeveridadIncidencia;
  /** HH:mm de la caída (UTC del día base). */
  hora: string;
}

export const CAIDOS: readonly CaidoSpec[] = [
  {
    nombre: 'ESPN',
    categoria: 'DEPORTES',
    tipoIncidencia: 'SIN_SENAL',
    severidad: 'CRITICA',
    hora: '09:42',
  },
  {
    nombre: 'Cartoon Network',
    categoria: 'INFANTIL',
    tipoIncidencia: 'SIN_SENAL',
    severidad: 'CRITICA',
    hora: '10:07',
  },
  {
    nombre: 'Discovery',
    categoria: 'DOCUMENTALES',
    tipoIncidencia: 'VIDEO_PIXELADO',
    severidad: 'ALTA',
    hora: '10:18',
  },
  {
    nombre: 'CNN Español',
    categoria: 'NOTICIAS',
    tipoIncidencia: 'IMAGEN_CONGELADA',
    severidad: 'ALTA',
    hora: '10:26',
  },
  {
    nombre: 'HBO Max',
    categoria: 'PREMIUM',
    tipoIncidencia: 'AUDIO_DESINCRONIZADO',
    severidad: 'MEDIA',
    hora: '10:39',
  },
  {
    nombre: 'Fox Sports',
    categoria: 'DEPORTES',
    tipoIncidencia: 'SENAL_INTERMITENTE',
    severidad: 'MEDIA',
    hora: '10:51',
  },
];

/**
 * Reparto realista de los 159 canales operativos por categoría. Suma 159; con los
 * 6 caídos da los 165 del diseño. Números fijos → seed determinista.
 */
const OPERATIVOS_POR_CATEGORIA: readonly [CategoriaCanal, number][] = [
  ['DEPORTES', 22],
  ['INFANTIL', 20],
  ['NOTICIAS', 24],
  ['DOCUMENTALES', 21],
  ['PREMIUM', 18],
  ['GENERAL', 34],
  ['MUSICA', 20],
];

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** `detectadoEn` de una caída: día base a la hora indicada, en UTC (determinista). */
function detectadoEn(hora: string): Date {
  return new Date(`${FECHA_BASE}T${hora}:00.000Z`);
}

/**
 * Construye los 165 canales de la grilla (6 caídos + 159 operativos) de forma
 * determinista: ids fijos (`canal-0001`…) para que `createMany`/`upsert` con
 * `skipDuplicates` sea idempotente. Los caídos van primero, ordenados por hora.
 */
export function construirCanales(): CanalSeed[] {
  const canales: CanalSeed[] = [];
  let orden = 0;

  for (const caido of CAIDOS) {
    orden += 1;
    canales.push({
      id: `canal-${String(orden).padStart(4, '0')}`,
      nombre: caido.nombre,
      categoria: caido.categoria,
      estado: 'CAIDO',
      tipoIncidencia: caido.tipoIncidencia,
      severidad: caido.severidad,
      detectadoEn: detectadoEn(caido.hora),
      orden,
    });
  }

  for (const [categoria, cantidad] of OPERATIVOS_POR_CATEGORIA) {
    for (let i = 1; i <= cantidad; i += 1) {
      orden += 1;
      const etiqueta = `${categoria.charAt(0)}${categoria.slice(1).toLowerCase()}`;
      canales.push({
        id: `canal-${String(orden).padStart(4, '0')}`,
        nombre: `${etiqueta} ${dosDigitos(i)}`,
        categoria,
        estado: 'OPERATIVO',
        tipoIncidencia: null,
        severidad: null,
        detectadoEn: null,
        orden,
      });
    }
  }

  return canales;
}

/** Contrato mínimo de Prisma que necesita el sembrado (facilita el test unitario). */
export interface CanalCreateManyClient {
  canal: {
    createMany(args: {
      data: CanalSeed[];
      skipDuplicates?: boolean;
    }): Promise<{ count: number }>;
  };
}

/**
 * Idempotente: `createMany` con `skipDuplicates` sobre ids deterministas.
 * Re-ejecutar no duplica ni rompe nada.
 */
export function sembrarCanales(
  prisma: CanalCreateManyClient,
): Promise<{ count: number }> {
  return prisma.canal.createMany({
    data: construirCanales(),
    skipDuplicates: true,
  });
}
