import type { Formatters, Labels } from 'react-day-picker'
import { DIAS, MESES } from '../../lib/fechas'

/**
 * Traducción al español del calendario de `react-day-picker`, que por defecto
 * rotula en inglés (cabecera, días de la semana y `aria-label` de navegación).
 *
 * Se resuelve con las props `formatters` y `labels` y las constantes propias en
 * es-VE: no dependemos de `date-fns/locale` (no está declarado como dependencia)
 * ni del ICU del entorno.
 */

/** `julio 2026` */
function mesYAnio(fecha: Date): string {
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
}

/** `miércoles, 15 de julio de 2026` */
function fechaLarga(fecha: Date): string {
  return `${DIAS[fecha.getDay()]}, ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`
}

/** Formateadores del texto visible del calendario. */
export const formatosEs: Partial<Formatters> = {
  formatCaption: mesYAnio,
  formatMonthDropdown: (mes) => MESES[mes.getMonth()],
  // Inicial de dos letras, como el `cccccc` por defecto: `lu`, `ma`, `mi`…
  formatWeekdayName: (dia) => DIAS[dia.getDay()].slice(0, 2),
  formatWeekNumberHeader: () => 'Sem.',
}

/** Nombres accesibles (`aria-label`) del calendario. */
export const etiquetasEs: Partial<Labels> = {
  labelNav: () => 'Navegación del calendario',
  labelGrid: mesYAnio,
  labelGridcell: (fecha) => fechaLarga(fecha),
  labelDayButton: (fecha, modificadores) => {
    let etiqueta = fechaLarga(fecha)
    if (modificadores.today) etiqueta = `Hoy, ${etiqueta}`
    if (modificadores.selected) etiqueta = `${etiqueta}, seleccionado`
    return etiqueta
  },
  labelWeekday: (fecha) => DIAS[fecha.getDay()],
  labelPrevious: () => 'Ir al mes anterior',
  labelNext: () => 'Ir al mes siguiente',
  labelMonthDropdown: () => 'Elige el mes',
  labelYearDropdown: () => 'Elige el año',
  labelWeekNumber: (semana) => `Semana ${semana}`,
  labelWeekNumberHeader: () => 'Número de semana',
}
