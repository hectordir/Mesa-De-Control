import type {
  AnalisisMensualBar,
  AnalisisMensualHeatmap,
} from '../../lib/api/types'

/** Cifras siempre en el formato local de la operación. */
export const fmt = (valor: number): string => valor.toLocaleString('es-VE')

/** Efectividad global del mes en porcentaje entero; sin volumen es 0. */
export function efectividad(volumen: number, resueltos: number): number {
  if (volumen <= 0) return 0
  return Math.round((resueltos / volumen) * 100)
}

export type MetaTono = 'success' | 'warning' | 'muted'

export interface MetaStatus {
  label: string
  tone: MetaTono
}

/** Distancia a la meta de equipo, en puntos porcentuales. */
export function metaStatus(
  valor: number,
  meta: number,
  hayDatos = true,
): MetaStatus {
  if (!hayDatos) return { label: '—', tone: 'muted' }
  return valor < meta
    ? { label: `${meta - valor} pts bajo meta`, tone: 'warning' }
    : { label: `${valor - meta} pts sobre meta`, tone: 'success' }
}

/** Alto útil del área de trazado, en px (el diseño fija 300). */
export const CHART_H = 300
/** Número de intervalos del eje Y: cinco marcas, cuatro tramos. */
const TRAMOS = 4

/**
 * Escalones "redondos" admitidos por década. Incluye 4,5 para que la serie del
 * diseño (máximo 1.620) caiga en el techo 1.800 con marcas de 450.
 */
const ESCALONES = [1, 1.5, 2, 2.5, 3, 4, 4.5, 5, 6, 7.5, 8, 9, 10] as const

function escalonBonito(crudo: number): number {
  if (crudo <= 0) return 1
  const base = 10 ** Math.floor(Math.log10(crudo))
  const fraccion = crudo / base
  const elegido = ESCALONES.find((n) => fraccion <= n + 1e-9) ?? 10
  return elegido * base
}

export interface ChartTick {
  value: number
  label: string
  /** Distancia al eje X, en px. */
  bottom: number
}

export interface ChartBar {
  name: string
  periodo: string
  resueltasPx: number
  restoPx: number
  resueltasFmt: string
  restoFmt: string
  totalFmt: string
  effPct: number
  /** Altura a la que se ancla el tooltip, en px. */
  tipBottom: number
}

export interface Chart {
  yMax: number
  ticks: ChartTick[]
  bars: ChartBar[]
}

/** Escala del eje, marcas y geometría de las barras apiladas. */
export function buildChart(serie: readonly AnalisisMensualBar[]): Chart {
  if (serie.length === 0) return { yMax: 0, ticks: [], bars: [] }

  const mayor = serie.reduce((acc, b) => Math.max(acc, b.resueltas + b.resto), 0)
  const escalon = escalonBonito(mayor / TRAMOS)
  const yMax = escalon * TRAMOS
  const px = (valor: number) => Math.round((valor / yMax) * CHART_H)

  const ticks = Array.from({ length: TRAMOS + 1 }, (_, i) => {
    const value = escalon * i
    return { value, label: fmt(value), bottom: px(value) }
  })

  const bars = serie.map((b) => {
    const total = b.resueltas + b.resto
    const resueltasPx = px(b.resueltas)
    const restoPx = px(b.resto)
    return {
      name: b.mes,
      periodo: b.periodo,
      resueltasPx,
      restoPx,
      resueltasFmt: fmt(b.resueltas),
      restoFmt: fmt(b.resto),
      totalFmt: fmt(total),
      effPct: total > 0 ? Math.round((b.resueltas / total) * 100) : 0,
      tipBottom: resueltasPx + restoPx + 10,
    }
  })

  return { yMax, ticks, bars }
}

export interface HeatCell {
  v: number
  /** Intensidad normalizada 0–1 contra el máximo de la matriz. */
  t: number
}

export interface HeatRow {
  zona: string
  cells: HeatCell[]
  total: number
  /** Intensidad del total de la fila, normalizada contra el mayor total. */
  totalT: number
}

export interface Heatmap {
  motivos: string[]
  rows: HeatRow[]
  maxCell: number
  maxTotal: number
  grandTotal: number
}

/** Matriz zona × motivo con totales e intensidades listas para pintar. */
export function buildHeatmap(heatmap: AnalisisMensualHeatmap): Heatmap {
  const totales = heatmap.zonas.map((z) =>
    z.valores.reduce((acc, v) => acc + v, 0),
  )
  const maxCell = Math.max(1, ...heatmap.zonas.flatMap((z) => z.valores))
  const maxTotal = Math.max(1, ...totales)

  return {
    motivos: heatmap.motivos,
    rows: heatmap.zonas.map((z, i) => ({
      zona: z.zona,
      cells: z.valores.map((v) => ({ v, t: v / maxCell })),
      total: totales[i],
      totalT: totales[i] / maxTotal,
    })),
    maxCell,
    maxTotal,
    grandTotal: totales.reduce((acc, t) => acc + t, 0),
  }
}

/** Filtro en cliente por nombre de zona, sin distinguir mayúsculas. */
export function filterZones(
  rows: readonly HeatRow[],
  query: string,
): HeatRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...rows]
  return rows.filter((r) => r.zona.toLowerCase().includes(q))
}
