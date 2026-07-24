import type {
  SupervisionHeatmap,
  SupervisionKpis,
  ZonaEstado,
} from '../../../lib/api/types'

/**
 * Capa de presentación de Admin · Supervisión.
 *
 * ÚNICO lugar donde se concentran las fórmulas de color del diseño (heatCell,
 * diasColor, gradiente SLA verde→ámbar→rojo, tonos KPI). Para respetar el tema
 * claro/oscuro y el guard "solo tokens", las bases NO son hex sino los tokens
 * semánticos del proyecto (`--color-*`); las fórmulas `color-mix` del diseño se
 * replican sobre esas variables en vez de sobre literales hex.
 */
export const ADMIN_HEX = {
  brand: 'var(--color-brand)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)',
  neutral: 'var(--color-neutral)',
} as const

export type SemanticTone = keyof typeof ADMIN_HEX

const mix = (hex: string, pct: number, into = 'transparent') =>
  `color-mix(in srgb, ${hex} ${pct}%, ${into})`

/* ── Zonas / mapa ─────────────────────────────────────────────────────────── */

export function zonaHex(estado: ZonaEstado): string {
  return ADMIN_HEX[estado]
}

export const ZONA_LEGEND: { label: string; estado: ZonaEstado }[] = [
  { label: 'Crítico', estado: 'danger' },
  { label: 'Atención', estado: 'warning' },
  { label: 'Seguimiento', estado: 'info' },
  { label: 'Estable', estado: 'success' },
]

/* ── KPIs ─────────────────────────────────────────────────────────────────── */

export interface KpiView {
  label: string
  value: string
  unit: string
  icon: string
  delta: string
  sub: string
  color: string
  tint: string
}

const tone = (t: SemanticTone) => ({
  color: ADMIN_HEX[t],
  tint: mix(ADMIN_HEX[t], 16, 'var(--color-surface)'),
})

const signed = (n: number) => `${n >= 0 ? '+' : ''}${n}`

export function buildKpis(k: SupervisionKpis): KpiView[] {
  return [
    {
      label: 'Atendidos hoy',
      value: String(k.atendidosHoy),
      unit: '',
      icon: '✆',
      delta: signed(k.atendidosDelta),
      sub: 'vs. ayer',
      ...tone('brand'),
    },
    {
      label: 'Efectividad Mesa',
      value: String(k.efectividad),
      unit: '%',
      icon: '◎',
      delta: `${signed(k.efectividad - k.efectividadMeta)} pts`,
      sub: `meta ${k.efectividadMeta}%`,
      ...tone('success'),
    },
    {
      label: 'Escalados a NOC',
      value: String(k.escaladosNoc),
      unit: '',
      icon: '▲',
      delta: signed(k.escaladosDelta),
      sub: 'vs. ayer',
      ...tone('danger'),
    },
    {
      label: 'SLA cumplido',
      value: String(k.slaCumplido),
      unit: '%',
      icon: '⏱',
      delta: `${signed(k.slaCumplido - k.slaMeta)} pts`,
      sub: `meta ${k.slaMeta}%`,
      ...tone('info'),
    },
  ]
}

/* ── SLA por antigüedad (verde → ámbar → rojo) ────────────────────────────── */

const SLA_COLOR: Record<string, string> = {
  '0': ADMIN_HEX.success,
  '1': mix(ADMIN_HEX.success, 55, ADMIN_HEX.warning),
  '2': ADMIN_HEX.warning,
  '3': mix(ADMIN_HEX.warning, 45, ADMIN_HEX.danger),
  '4+': ADMIN_HEX.danger,
}

export function slaColor(key: string): string {
  return SLA_COLOR[key] ?? ADMIN_HEX.neutral
}

export function slaRowTint(key: string): string {
  return mix(slaColor(key), 8)
}

/* ── Bandeja Nivel 2 (días de antigüedad) ─────────────────────────────────── */

export function diasColor(dias: number): string {
  if (dias >= 4) return ADMIN_HEX.danger
  if (dias >= 3) return mix(ADMIN_HEX.warning, 45, ADMIN_HEX.danger)
  if (dias >= 2) return ADMIN_HEX.warning
  return ADMIN_HEX.success
}

export function diasLabel(dias: number): string {
  if (dias >= 4) return `${dias} días ⚠`
  return `${dias} ${dias === 1 ? 'día' : 'días'}`
}

const ESTADO_TONE: { match: RegExp; tone: SemanticTone }[] = [
  { match: /noc/i, tone: 'danger' },
  { match: /espera/i, tone: 'info' },
  { match: /soporte/i, tone: 'warning' },
]

export function estadoTone(estado: string): SemanticTone {
  return ESTADO_TONE.find((e) => e.match.test(estado))?.tone ?? 'neutral'
}

export function estadoHex(estado: string): string {
  return ADMIN_HEX[estadoTone(estado)]
}

export function estadoTint(estado: string): string {
  return mix(estadoHex(estado), 16, 'var(--color-surface)')
}

/* ── HeatMap Diario (intensidad por celda) ────────────────────────────────── */

export interface HeatCell {
  bg: string
  color: string
}

export function heatCell(n: number): HeatCell {
  if (n <= 0) return { bg: 'transparent', color: 'var(--color-text-muted)' }
  let base: string
  if (n <= 2) base = ADMIN_HEX.info
  else if (n <= 4) base = ADMIN_HEX.success
  else if (n <= 6) base = ADMIN_HEX.warning
  else if (n <= 8) base = mix(ADMIN_HEX.warning, 40, ADMIN_HEX.danger)
  else base = ADMIN_HEX.danger
  const strength = Math.min(0.14 + n * 0.06, 0.55)
  return {
    bg: mix(base, Math.round(strength * 100)),
    color: 'var(--color-text-primary)',
  }
}

/** Máximo de columnas de motivo antes de agregar el resto en "Otros". */
export const HEATMAP_TOP_MOTIVOS = 6

export interface HeatDerived {
  /** Columnas visibles: hasta 6 motivos top y, si sobran, "Otros". */
  motivos: string[]
  /** `celdas` alineadas a `motivos`; `total` es el real de TODA la fila. */
  filas: { zona: string; celdas: number[]; total: number }[]
}

/**
 * Acota el HeatMap para que la tabla quepa sin scroll horizontal: toma los
 * `topN` motivos con mayor volumen total (suma de celdas en todas las zonas,
 * orden descendente; empate → orden original) y agrega el resto en una columna
 * "Otros". El `total` de cada fila se recalcula sobre TODOS los motivos, no solo
 * los mostrados, para no perder información. Con ≤ `topN` motivos no añade "Otros".
 */
export function deriveHeatmap(
  heatmap: SupervisionHeatmap,
  topN = HEATMAP_TOP_MOTIVOS,
): HeatDerived {
  const { motivos, filas } = heatmap
  const rowTotal = (celdas: number[]) => celdas.reduce((a, b) => a + b, 0)

  if (motivos.length <= topN) {
    return {
      motivos: [...motivos],
      filas: filas.map((f) => ({
        zona: f.zona,
        celdas: [...f.celdas],
        total: rowTotal(f.celdas),
      })),
    }
  }

  const volumen = motivos.map((_, i) =>
    filas.reduce((a, f) => a + (f.celdas[i] ?? 0), 0),
  )
  const topIdx = motivos
    .map((_, i) => i)
    .sort((a, b) => volumen[b] - volumen[a] || a - b)
    .slice(0, topN)
  const topSet = new Set(topIdx)
  const restIdx = motivos.map((_, i) => i).filter((i) => !topSet.has(i))

  return {
    motivos: [...topIdx.map((i) => motivos[i]), 'Otros'],
    filas: filas.map((f) => ({
      zona: f.zona,
      celdas: [
        ...topIdx.map((i) => f.celdas[i] ?? 0),
        restIdx.reduce((a, i) => a + (f.celdas[i] ?? 0), 0),
      ],
      total: rowTotal(f.celdas),
    })),
  }
}

export function heatTotalBg(total: number): string {
  const pct = total > 0 ? Math.min(14 + total * 3, 45) : 8
  return mix(ADMIN_HEX.brand, pct)
}

export const HEAT_LEGEND: { label: string; hex: string }[] = [
  { label: '0', hex: 'var(--color-border)' },
  { label: '1–2', hex: ADMIN_HEX.info },
  { label: '3–4', hex: ADMIN_HEX.success },
  { label: '5–6', hex: ADMIN_HEX.warning },
  { label: '7–8', hex: mix(ADMIN_HEX.warning, 40, ADMIN_HEX.danger) },
  { label: '9+', hex: ADMIN_HEX.danger },
]

/* ── Fechas ───────────────────────────────────────────────────────────────── */

const MESES = [
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
]

export function formatFechaLarga(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} de ${MESES[m - 1] ?? ''} ${y}`
}

export function formatFechaCorta(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** Fecha de hoy del sistema en 'YYYY-MM-DD' (para anclar la vista al seed). */
export function todayIso(): string {
  const now = new Date()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${mm}-${dd}`
}
