import type { DistribucionItem, OperadorResumen } from '../../lib/api/types'
import { resultadoMeta } from './resultado'

/** Efectividad de mesa en porcentaje entero; sin clientes atendidos es 0. */
export function efectividad(mesa: number, clientes: number): number {
  if (clientes <= 0) return 0
  return Math.round((mesa / clientes) * 100)
}

export type Tono = 'success' | 'warning'

/** Verde a partir de la meta del 75 %, ámbar por debajo. */
export function efectividadTono(valor: number): Tono {
  return valor >= 75 ? 'success' : 'warning'
}

/** Primera letra de las dos primeras palabras del nombre, en mayúscula. */
export function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('')
}

export interface TotalesOperadores {
  clientes: number
  mesa: number
  soporte2: number
  noc: number
}

export function totales(operadores: readonly OperadorResumen[]): TotalesOperadores {
  return operadores.reduce<TotalesOperadores>(
    (acc, o) => ({
      clientes: acc.clientes + o.clientes,
      mesa: acc.mesa + o.mesa,
      soporte2: acc.soporte2 + o.soporte2,
      noc: acc.noc + o.noc,
    }),
    { clientes: 0, mesa: 0, soporte2: 0, noc: 0 },
  )
}

export interface SegmentoDonut extends DistribucionItem {
  /** Porcentaje sobre el total, con un decimal. */
  pct: number
  /** Corte acumulado (%) donde termina el segmento en el conic-gradient. */
  hasta: number
  color: string
  label: string
}

const unDecimal = (valor: number) => Math.round(valor * 10) / 10

export function segmentosDonut(
  items: readonly DistribucionItem[],
): SegmentoDonut[] {
  const suma = items.reduce((acc, i) => acc + i.total, 0)
  let acumulado = 0

  return items.map((item, indice) => {
    const pct = suma > 0 ? unDecimal((item.total / suma) * 100) : 0
    // Acumulamos los porcentajes ya redondeados para que el corte del
    // conic-gradient case exactamente con lo que muestra la leyenda.
    acumulado = unDecimal(acumulado + pct)
    const ultimo = indice === items.length - 1
    const meta = resultadoMeta[item.resultado]
    return {
      ...item,
      pct,
      hasta: ultimo && suma > 0 ? 100 : acumulado,
      color: meta.serie,
      label: meta.label,
    }
  })
}

/** Fondo del donut: un `conic-gradient` calculado, sin librería de charts. */
export function conicGradient(segmentos: readonly SegmentoDonut[]): string {
  let desde = 0
  const paradas = segmentos.map((s) => {
    const tramo = `${s.color} ${desde === 0 ? '0' : `${desde}%`} ${s.hasta}%`
    desde = s.hasta
    return tramo
  })
  return `conic-gradient(${paradas.join(', ')})`
}

/** Anchos decrecientes de los esqueletos de carga, como en el diseño. */
export const ANCHOS_SKELETON = [88, 66, 52, 40, 31] as const

/** Ancho relativo (%) de la barra de una avería respecto al máximo del top. */
export function anchoBarra(total: number, maximo: number): number {
  if (maximo <= 0) return 0
  return Math.round((total / maximo) * 100)
}

/**
 * Hora de pared tal y como la envía el backend (`HH:mm`), sin reinterpretarla
 * en la zona del navegador: la mesa opera siempre en la hora de la operación.
 */
export function horaCorta(iso: string): string {
  return /T(\d{2}:\d{2})/.exec(iso)?.[1] ?? ''
}
