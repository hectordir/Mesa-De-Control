import { useCallback, useMemo } from 'react'
import { MESES } from './useOperationDay'
import { mesActualVE } from '../../../lib/tiempoVE'
import { useDashboardDateStore } from '../../../stores/dashboardDate.store'

/** Cantidad de meses ofrecidos en el desplegable. */
const MESES_DISPONIBLES = 12

/** `Mayo 2026` a partir de un periodo `YYYY-MM`. */
export function etiquetaMes(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number)
  const nombre = MESES[mes - 1] ?? ''
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${anio}`
}

const iso = (anio: number, mes: number) =>
  `${anio}-${`${mes}`.padStart(2, '0')}`

/** Mes en curso en `YYYY-MM`, en la hora de la operación (Venezuela). */
export function mesActualISO(): string {
  return mesActualVE()
}

export interface MonthOption {
  value: string
  label: string
}

export interface MonthFilterState {
  /** YYYY-MM */
  periodo: string
  etiqueta: string
  opciones: MonthOption[]
  esMesActual: boolean
  setPeriodo: (periodo: string) => void
  volverAlMesActual: () => void
}

/**
 * Mes consultado por la vista: el actual por defecto, con los 12 últimos.
 *
 * El periodo no es estado propio: se **deriva** de la fecha compartida en
 * `useDashboardDateStore`, y elegir un mes fija su día 1. Así el Monitor Diario
 * y esta vista no pueden discrepar.
 */
export function useMonthFilter(): MonthFilterState {
  const fecha = useDashboardDateStore((estado) => estado.fecha)
  const setFecha = useDashboardDateStore((estado) => estado.setFecha)
  const periodo = fecha.slice(0, 7)

  const cambiar = useCallback(
    (valor: string) => setFecha(`${valor}-01`),
    [setFecha],
  )
  const volverAlMesActual = useCallback(
    () => setFecha(`${mesActualISO()}-01`),
    [setFecha],
  )

  const opciones = useMemo(() => {
    // Se cuenta hacia atrás desde el mes venezolano en curso; el `Date` sólo
    // hace de calculadora de calendario (día 1, sin hora), no de reloj.
    const [anio, mes] = mesActualISO().split('-').map(Number)
    const ultimos = Array.from({ length: MESES_DISPONIBLES }, (_, i) => {
      const fecha = new Date(anio, mes - 1 - i, 1)
      const value = iso(fecha.getFullYear(), fecha.getMonth() + 1)
      return { value, label: etiquetaMes(value) }
    })
    // El calendario diario admite cualquier día pasado, también de un mes
    // anterior a los doce ofrecidos. Sin esta opción el `<select>` quedaría con
    // un `value` inexistente y el navegador mostraría otro mes.
    if (ultimos.some((opcion) => opcion.value === periodo)) return ultimos
    return [...ultimos, { value: periodo, label: etiquetaMes(periodo) }].sort(
      (a, b) => b.value.localeCompare(a.value),
    )
  }, [periodo])

  return useMemo(
    () => ({
      periodo,
      etiqueta: etiquetaMes(periodo),
      opciones,
      esMesActual: periodo === mesActualISO(),
      setPeriodo: cambiar,
      volverAlMesActual,
    }),
    [periodo, opciones, cambiar, volverAlMesActual],
  )
}
