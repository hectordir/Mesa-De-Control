/**
 * Formateo de instantes en hora venezolana.
 *
 * Fuente única de verdad para convertir un `Date` (instante absoluto, sellado en
 * UTC por Postgres) a lo que un usuario en Venezuela espera leer.
 *
 * Se usa `Intl.DateTimeFormat` con la zona IANA explícita y NUNCA una resta fija
 * de 4 horas: Venezuela tuvo offset −04:30 entre 2007 y 2016, y una resta fija
 * falsearía cualquier fecha histórica de esa franja.
 *
 * OJO — esto es para INSTANTES (`createdAt`, `updatedAt`, `detectadoEn`).
 * La columna `Gestion.fecha` es `@db.Date`: Prisma la devuelve como medianoche
 * UTC y pasarla por aquí la retrasaría un día entero. Esa se sigue formateando
 * con `toISOString()`.
 */

/** Zona horaria oficial de Venezuela (IANA). */
export const ZONA_VE = 'America/Caracas';

type PartesVE = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
};

/**
 * `en-CA` + `hourCycle: 'h23'` garantizan partes numéricas de dos dígitos y sin
 * marcador AM/PM, independientemente del locale por defecto del proceso.
 */
const FORMATO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_VE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partesVE(d: Date): PartesVE {
  const partes = {} as Record<string, string>;
  for (const { type, value } of FORMATO.formatToParts(d)) {
    if (type !== 'literal') partes[type] = value;
  }
  return partes as PartesVE;
}

/** `HH:mm` (24 horas) del instante, en hora de Caracas. */
export function formatHoraVE(d: Date): string {
  const { hour, minute } = partesVE(d);
  return `${hour}:${minute}`;
}

/**
 * `h:mm a. m./p. m.` (12 horas, es-VE) del instante, en hora de Caracas.
 * El sufijo se deriva de la hora en 24h en vez de pedirle el `dayPeriod` a ICU:
 * su texto exacto (y el tipo de espacio) varía entre versiones de Node.
 */
export function formatHora12VE(d: Date): string {
  const { hour, minute } = partesVE(d);
  const h24 = Number(hour);
  const h12 = h24 % 12 || 12;
  return `${h12}:${minute} ${h24 < 12 ? 'a. m.' : 'p. m.'}`;
}

/** `DD/MM/YYYY` del instante, en día calendario de Caracas. */
export function formatFechaVE(d: Date): string {
  const { year, month, day } = partesVE(d);
  return `${day}/${month}/${year}`;
}

/** Día calendario de Caracas del instante, como `YYYY-MM-DD`. */
export function hoyVE(d: Date = new Date()): string {
  const { year, month, day } = partesVE(d);
  return `${year}-${month}-${day}`;
}

/** Mes calendario de Caracas del instante, como `YYYY-MM`. */
export function mesActualVE(d: Date = new Date()): string {
  const { year, month } = partesVE(d);
  return `${year}-${month}`;
}
