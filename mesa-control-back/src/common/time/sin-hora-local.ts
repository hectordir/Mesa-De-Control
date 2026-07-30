/**
 * Utilidad SOLO para tests: ejecuta `fn` con los getters de hora LOCAL de `Date`
 * saboteados, de modo que cualquier cálculo que dependa de la zona del proceso
 * explote en vez de "funcionar por casualidad" porque el host corre en Caracas.
 *
 * Es más fiable que manipular `process.env.TZ` dentro de un test: Jest sandboxea
 * `process.env`, así que escribirlo NO invalida la caché de zona de V8.
 */
const LOCALES = [
  'getFullYear',
  'getMonth',
  'getDate',
  'getHours',
  'getMinutes',
  'getDay',
] as const;

type GetterLocal = (typeof LOCALES)[number];
type Getters = Record<GetterLocal, () => number>;

/** Vista del prototipo como diccionario: evita tratar los getters como métodos. */
const proto = Date.prototype as unknown as Getters;

function sabotear(): Map<GetterLocal, () => number> {
  const originales = new Map<GetterLocal, () => number>();
  for (const m of LOCALES) {
    originales.set(m, proto[m]);
    proto[m] = () => {
      throw new Error(
        `Date.prototype.${m}() depende de la zona del proceso: usa el helper de src/common/time.`,
      );
    };
  }
  return originales;
}

function restaurar(originales: Map<GetterLocal, () => number>): void {
  for (const [m, original] of originales) proto[m] = original;
}

/** Corre `fn` (async) sin acceso a la hora local del proceso. */
export async function sinHoraLocal<T>(fn: () => Promise<T> | T): Promise<T> {
  const originales = sabotear();
  try {
    return await fn();
  } finally {
    restaurar(originales);
  }
}
