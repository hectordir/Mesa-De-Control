/**
 * Nombres de días y meses en es-VE, compartidos por toda la app.
 *
 * Viven aquí (y no en `features/dashboard`) porque los consume también
 * `components/ui`, que no puede depender de una feature. El formateo es propio:
 * `Intl` depende del ICU del entorno y aquí sólo necesitamos patrones fijos y
 * deterministas.
 */

/** Días de la semana, indexados como `Date#getDay()` (0 = domingo). */
export const DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const

/** Meses en minúscula, indexados como `Date#getMonth()` (0 = enero). */
export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const
