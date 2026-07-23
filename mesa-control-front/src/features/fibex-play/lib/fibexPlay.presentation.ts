import type { BadgeTone } from '../../../components/ui'
import type {
  CategoriaCanal,
  DistribucionSeveridadItem,
  SeveridadIncidencia,
  TipoIncidencia,
} from '../../../lib/api/types'

/* ── Mapas enum → etiqueta legible ─────────────────────────────────────────── */

export const CATEGORIA_LABEL: Record<CategoriaCanal, string> = {
  DEPORTES: 'Deportes',
  INFANTIL: 'Infantil',
  NOTICIAS: 'Noticias',
  DOCUMENTALES: 'Documentales',
  PREMIUM: 'Premium',
  GENERAL: 'General',
  MUSICA: 'Música',
}

export const INCIDENCIA_LABEL: Record<TipoIncidencia, string> = {
  SIN_SENAL: 'Sin señal',
  VIDEO_PIXELADO: 'Video pixelado',
  IMAGEN_CONGELADA: 'Imagen congelada',
  AUDIO_DESINCRONIZADO: 'Audio desincronizado',
  SENAL_INTERMITENTE: 'Señal intermitente',
}

export const SEVERIDAD_LABEL: Record<SeveridadIncidencia, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
}

/* ── Mapas enum → color/tono (semántica del diseño, no negociable) ──────────── */

/** Tono del `Badge`/pill de severidad: Crítica=danger, Alta=warning, Media=info. */
export const SEVERIDAD_TONE: Record<SeveridadIncidencia, BadgeTone> = {
  CRITICA: 'danger',
  ALTA: 'warning',
  MEDIA: 'info',
}

/** Clase Tailwind de texto por severidad. */
export const SEVERIDAD_TEXT: Record<SeveridadIncidencia, string> = {
  CRITICA: 'text-danger',
  ALTA: 'text-warning',
  MEDIA: 'text-info',
}

/** Clase Tailwind de fondo (punto/marcador) por severidad. */
export const SEVERIDAD_DOT: Record<SeveridadIncidencia, string> = {
  CRITICA: 'bg-danger',
  ALTA: 'bg-warning',
  MEDIA: 'bg-info',
}

/** Token CSS por severidad, para los `conic-gradient` del donut. */
export const SEVERIDAD_TOKEN: Record<SeveridadIncidencia, string> = {
  CRITICA: 'var(--color-danger)',
  ALTA: 'var(--color-warning)',
  MEDIA: 'var(--color-info)',
}

/* ── Salud de la grilla ────────────────────────────────────────────────────── */

export interface SaludMeta {
  /** Clase Tailwind de texto del número de salud y del anillo. */
  text: string
  /** Token CSS para el tramo lleno del anillo. */
  token: string
  /** Glifo del centro del anillo: ✓ al 100 %, ! con caídas. */
  glifo: string
}

/** Verde solo al 100 %; ámbar ≥90 %; rojo por debajo. */
export function saludMeta(health: number): SaludMeta {
  if (health >= 100)
    return { text: 'text-success', token: 'var(--color-success)', glifo: '✓' }
  if (health >= 90)
    return { text: 'text-warning', token: 'var(--color-warning)', glifo: '!' }
  return { text: 'text-danger', token: 'var(--color-danger)', glifo: '!' }
}

/** Anillo de salud: tramo lleno con el token de salud, resto en la pista. */
export function healthRingBg(health: number, token: string): string {
  const deg = Math.round((Math.max(0, Math.min(100, health)) / 100) * 360)
  return `conic-gradient(${token} ${deg}deg, var(--color-border-subtle) ${deg}deg)`
}

/* ── Donut de severidad ────────────────────────────────────────────────────── */

/** Donut por severidades: segmentos acumulados con el token de cada una. */
export function severityDonutBg(
  distribucion: readonly DistribucionSeveridadItem[],
): string {
  const suma = distribucion.reduce((acc, d) => acc + d.total, 0)
  if (suma <= 0) return 'var(--color-success)'
  let desde = 0
  const paradas = distribucion.map((d, i) => {
    const pct = (d.total / suma) * 100
    const ultimo = i === distribucion.length - 1
    const hasta = ultimo ? 100 : desde + pct
    const token = SEVERIDAD_TOKEN[d.severidad]
    const tramo = `${token} ${desde === 0 ? '0' : `${desde}%`} ${hasta}%`
    desde = hasta
    return tramo
  })
  return `conic-gradient(${paradas.join(', ')})`
}
