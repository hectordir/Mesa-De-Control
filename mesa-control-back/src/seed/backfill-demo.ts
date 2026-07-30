import {
  abonadoPorIndice,
  atencionPorIndice,
  AtencionDemo,
} from './gestiones-demo';

/**
 * Backfill de las filas demo ya persistidas.
 *
 * `createMany({ skipDuplicates: true })` no actualiza lo que ya existe, así que
 * las jornadas sembradas en días anteriores conservan los valores viejos:
 * `abonado` con forma de zona (`Cond. Los Robles · Casa 07`) y
 * `detalle`/`solucion`/`tipo`/`observacion` en `''` (el default del schema).
 *
 * El plan que produce este módulo es **convergente**: aplicarlo dos veces
 * seguidas da el mismo resultado, porque el valor esperado de cada fila sale o
 * bien del builder (si esta corrida la regenera) o bien del propio id (hash),
 * nunca de un aleatorio. Solo toca ids del seed; las gestiones creadas por el
 * POST (uuid) quedan intactas aunque tengan campos vacíos.
 */

/** Prefijos de id que identifican una fila del seed demo. */
export const PREFIJOS_DEMO = ['seed-', 'sup-', 'mensual-', 'enero-'] as const;

export function esIdDemo(id: string): boolean {
  return PREFIJOS_DEMO.some((p) => id.startsWith(p));
}

/** FNV-1a: hash estable del id, sin dependencias ni aleatoriedad. */
function hashId(id: string): number {
  let h = 0x811c9dc5;
  for (const c of id) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Identificador Fibex derivado del id, para filas que ningún builder regenera. */
export function abonadoDeId(id: string): string {
  return abonadoPorIndice(hashId(id) % 9_000_000);
}

/** `detalle`/`solucion`/`tipo`/`observacion` derivados del id (mismos catálogos). */
export function atencionDeId(id: string): AtencionDemo {
  return atencionPorIndice(hashId(id));
}

/** Los campos que este backfill gestiona, tal como vienen de la BD. */
export interface FilaDemo {
  id: string;
  abonado: string;
  detalle: string;
  solucion: string;
  tipo: string;
  observacion: string;
}

/** Cambios a aplicar sobre una fila concreta (solo lo que hay que escribir). */
export interface ParcheDemo {
  id: string;
  datos: Partial<Omit<FilaDemo, 'id'>>;
}

/** Campos de texto que solo se rellenan si están vacíos. */
const CAMPOS_VACIOS = ['detalle', 'solucion', 'tipo', 'observacion'] as const;

/**
 * Calcula qué escribir en cada fila demo ya persistida.
 *
 * - `abonado`: se **reasigna** si no coincide con el esperado (contiene zonas del
 *   seed antiguo). Es el único campo que se sobrescribe con valor no vacío.
 * - `detalle`/`solucion`/`tipo`/`observacion`: solo se rellenan si están en `''`;
 *   un valor histórico fuera de catálogo se respeta (`conValorActual` lo conserva
 *   en el front).
 */
export function planBackfillDemo(
  existentes: readonly FilaDemo[],
  generadas: readonly FilaDemo[],
): ParcheDemo[] {
  const porId = new Map(generadas.map((g) => [g.id, g]));

  const parches: ParcheDemo[] = [];
  for (const fila of existentes) {
    if (!esIdDemo(fila.id)) continue;

    const generada = porId.get(fila.id);
    const datos: Partial<Omit<FilaDemo, 'id'>> = {};

    const abonado = generada?.abonado ?? abonadoDeId(fila.id);
    if (fila.abonado !== abonado) datos.abonado = abonado;

    const atencion = generada ?? atencionDeId(fila.id);
    for (const campo of CAMPOS_VACIOS) {
      if (fila[campo] === '') datos[campo] = atencion[campo];
    }

    if (Object.keys(datos).length > 0) parches.push({ id: fila.id, datos });
  }
  return parches;
}
