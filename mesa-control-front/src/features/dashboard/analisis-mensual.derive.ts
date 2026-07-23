import type {
  AnalisisMensualBar,
  AnalisisMensualDia,
  AnalisisMensualHeatmap,
  AnalisisMensualMotivo,
  AnalisisMensualOperador,
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

/* ── Bloque analítico inferior (Revisión 2) ─────────────────────────────────
   Todas las derivaciones son puras y se apoyan en `fmt` y `escalonBonito`.    */

/**
 * Paleta cíclica del bloque: series categóricas y luego tonos semánticos, para
 * que dos motivos contiguos nunca compartan color. Solo tokens.
 */
const PALETA = [
  'var(--color-cat-1)',
  'var(--color-cat-2)',
  'var(--color-cat-3)',
  'var(--color-cat-4)',
  'var(--color-cat-5)',
  'var(--color-cat-6)',
  'var(--color-warning)',
  'var(--color-success)',
  'var(--color-info)',
  'var(--color-neutral)',
] as const

const colorEn = (indice: number) => PALETA[indice % PALETA.length]

/** Eje "bonito": techo, marcas y proyección a píxeles sobre un alto dado. */
export interface Eje {
  yMax: number
  escalon: number
  px: (valor: number) => number
  ticks: ChartTick[]
}

export function ejeBonito(maximo: number, alto: number, tramos = TRAMOS): Eje {
  const escalon = escalonBonito(maximo / tramos)
  const yMax = escalon * tramos
  const px = (valor: number) => Math.round((valor / yMax) * alto)
  const ticks = Array.from({ length: tramos + 1 }, (_, i) => {
    const value = escalon * i
    return { value, label: fmt(value), bottom: px(value) }
  })
  return { yMax, escalon, px, ticks }
}

export interface DistribucionSeg {
  label: string
  total: number
  /** Porcentaje entero; el conjunto suma 100. */
  pct: number
  color: string
}

/**
 * Reparte el mes por motivo en porcentajes enteros que suman 100 (el sobrante
 * del redondeo va al mayor). Con más de `max` motivos, agrupa el resto en
 * "Otros". Presupone `motivos` ya ordenado desc por total.
 */
export function buildDistribucion(
  motivos: readonly AnalisisMensualMotivo[],
  { max = 9 }: { max?: number } = {},
): DistribucionSeg[] {
  const items: Array<{ label: string; total: number }> =
    motivos.length > max
      ? [
          ...motivos.slice(0, max - 1).map((m) => ({ label: m.motivo, total: m.total })),
          {
            label: 'Otros',
            total: motivos.slice(max - 1).reduce((a, m) => a + m.total, 0),
          },
        ]
      : motivos.map((m) => ({ label: m.motivo, total: m.total }))

  const suma = items.reduce((a, i) => a + i.total, 0)
  const pcts = items.map((i) => (suma > 0 ? Math.round((i.total / suma) * 100) : 0))
  const sobrante = suma > 0 ? 100 - pcts.reduce((a, p) => a + p, 0) : 0
  if (sobrante !== 0 && pcts.length > 0) {
    const mayor = items.reduce((mi, it, i) => (it.total > items[mi].total ? i : mi), 0)
    pcts[mayor] += sobrante
  }

  return items.map((i, idx) => ({
    label: i.label,
    total: i.total,
    pct: pcts[idx],
    color: colorEn(idx),
  }))
}

/** Fondo del donut mensual: un `conic-gradient` acumulando los `pct`. */
export function donutBg(segmentos: readonly DistribucionSeg[]): string {
  let desde = 0
  const paradas = segmentos.map((s) => {
    const hasta = desde + s.pct
    const tramo = `${s.color} ${desde}% ${hasta}%`
    desde = hasta
    return tramo
  })
  return `conic-gradient(${paradas.join(', ')})`
}

/** Alto útil de las barras de clientes atendidos, en px (diseño: 230). */
export const AT_H = 230

export interface AtendidoBar {
  label: string
  total: number
  px: number
  color: string
}

export interface Atendidos {
  barras: AtendidoBar[]
  ticks: ChartTick[]
  yMax: number
}

/** Barras verticales por motivo (top `max`), con eje escalado al mayor. */
export function buildAtendidos(
  motivos: readonly AnalisisMensualMotivo[],
  { max = 9 }: { max?: number } = {},
): Atendidos {
  const top = motivos.slice(0, max)
  const mayor = Math.max(1, ...top.map((m) => m.total))
  const eje = ejeBonito(mayor, AT_H)
  return {
    barras: top.map((m, i) => ({
      label: m.motivo,
      total: m.total,
      px: eje.px(m.total),
      color: colorEn(i),
    })),
    ticks: eje.ticks,
    yMax: eje.yMax,
  }
}

/** Alto útil de las barras Solución vs Nivel 2, en px (diseño: 210). */
export const N2_H = 210
/** Medallas del podio por puesto; el bronce no tiene token semántico propio. */
const MEDALLAS = [
  'var(--color-warning)',
  'var(--color-text-secondary)',
  'var(--color-bronze)',
] as const

export interface OperadorBar {
  id: string
  nombre: string
  solucionados: number
  enviadosN2: number
  total: number
  solPx: number
  n2Px: number
  /** Tasa de solución = round(sol / (sol + n2) * 100). */
  tasa: number
}

export interface TopOperador {
  id: string
  nombre: string
  total: number
  rank: number
  /** Eficiencia = round(solucionados / total * 100). */
  eficiencia: number
  medal: string
}

export interface Operadores {
  barras: OperadorBar[]
  ticks: ChartTick[]
  top: TopOperador[]
}

/** Orden desc por total; geometría de Solución-vs-N2 y podio de eficiencia. */
export function buildOperadores(
  operadores: readonly AnalisisMensualOperador[],
): Operadores {
  const ordenados = [...operadores].sort((a, b) => b.total - a.total)
  const mayor = Math.max(
    1,
    ...ordenados.map((o) => Math.max(o.solucionados, o.enviadosN2)),
  )
  const eje = ejeBonito(mayor, N2_H)

  const barras = ordenados.map((o) => {
    const base = o.solucionados + o.enviadosN2
    return {
      id: o.id,
      nombre: o.nombre,
      solucionados: o.solucionados,
      enviadosN2: o.enviadosN2,
      total: o.total,
      solPx: eje.px(o.solucionados),
      n2Px: eje.px(o.enviadosN2),
      tasa: base > 0 ? Math.round((o.solucionados / base) * 100) : 0,
    }
  })

  const top = ordenados.slice(0, 5).map((o, i) => ({
    id: o.id,
    nombre: o.nombre,
    total: o.total,
    rank: i + 1,
    eficiencia: o.total > 0 ? Math.round((o.solucionados / o.total) * 100) : 0,
    medal: MEDALLAS[i] ?? 'var(--color-text-muted)',
  }))

  return { barras, ticks: eje.ticks, top }
}

/** Ancho y alto del lienzo de la tendencia, en unidades de `viewBox`. */
export const TREND_W = 940
export const TREND_H = 250

export interface TrendDot {
  cx: number
  cy: number
}

export interface TrendGrid {
  y: number
  label: string
  bottom: number
}

export interface Tendencia {
  linePts: string
  areaPts: string
  dots: TrendDot[]
  grid: TrendGrid[]
  labels: string[]
  filas: AnalisisMensualDia[]
  yMax: number
}

const ddMM = (fecha: string): string => {
  const [, mm, dd] = fecha.split('-')
  return `${dd}/${mm}`
}

const dec1 = (n: number) => Math.round(n * 10) / 10

/** Serie diaria como área + línea SVG, con rejilla, etiquetas y filas de tabla. */
export function buildTendencia(
  dias: readonly AnalisisMensualDia[],
): Tendencia {
  if (dias.length === 0) {
    return {
      linePts: '',
      areaPts: '',
      dots: [],
      grid: [],
      labels: [],
      filas: [],
      yMax: 0,
    }
  }

  const mayor = Math.max(1, ...dias.map((d) => d.atendidos))
  const eje = ejeBonito(mayor, TREND_H)
  const yMax = eje.yMax
  const denom = Math.max(1, dias.length - 1)
  const cx = (i: number) => dec1((i / denom) * TREND_W)
  const cy = (v: number) => dec1(TREND_H - (v / yMax) * TREND_H)

  const dots = dias.map((d, i) => ({ cx: cx(i), cy: cy(d.atendidos) }))
  const linePts = dots.map((p) => `${p.cx},${p.cy}`).join(' ')

  return {
    linePts,
    areaPts: `0,${TREND_H} ${linePts} ${TREND_W},${TREND_H}`,
    dots,
    grid: eje.ticks.map((t) => ({
      y: cy(t.value),
      label: t.label,
      bottom: t.bottom,
    })),
    labels: dias.map((d) => ddMM(d.fecha)),
    filas: dias.map((d) => ({ fecha: d.fecha, atendidos: d.atendidos })),
    yMax,
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
