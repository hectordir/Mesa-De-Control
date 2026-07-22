import { useCallback, useMemo, useState } from 'react'
import { MESES } from './useOperationDay'

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

/** Mes en curso en `YYYY-MM` (hora local, sin desfase por UTC). */
export function mesActualISO(): string {
  const ahora = new Date()
  return iso(ahora.getFullYear(), ahora.getMonth() + 1)
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
  setPeriodo: (periodo: string) => void
}

/** Mes consultado por la vista: el actual por defecto, con los 12 últimos. */
export function useMonthFilter(): MonthFilterState {
  const [periodo, setPeriodo] = useState(mesActualISO)
  const cambiar = useCallback((valor: string) => setPeriodo(valor), [])

  const opciones = useMemo(() => {
    const ahora = new Date()
    return Array.from({ length: MESES_DISPONIBLES }, (_, i) => {
      const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const value = iso(fecha.getFullYear(), fecha.getMonth() + 1)
      return { value, label: etiquetaMes(value) }
    })
  }, [])

  return useMemo(
    () => ({
      periodo,
      etiqueta: etiquetaMes(periodo),
      opciones,
      setPeriodo: cambiar,
    }),
    [periodo, opciones, cambiar],
  )
}
