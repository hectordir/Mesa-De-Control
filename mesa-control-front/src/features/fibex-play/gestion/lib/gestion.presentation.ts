import type { EstadoAtencion, OrigenItem } from '../../../../lib/api/types'

/* ── Estado de atención → etiqueta / color (semántica del diseño) ──────────── */

export const ESTADO_LABEL: Record<EstadoAtencion, string> = {
  SOLUCIONADO: 'Solucionado',
  EN_PROCESO: 'En proceso',
  ESCALADO: 'Escalado',
}

/** Clase Tailwind de fondo del punto de la pill de estado. */
export const ESTADO_DOT: Record<EstadoAtencion, string> = {
  SOLUCIONADO: 'bg-success',
  EN_PROCESO: 'bg-warning',
  ESCALADO: 'bg-danger',
}

/** Clase Tailwind de texto por estado. */
export const ESTADO_TEXT: Record<EstadoAtencion, string> = {
  SOLUCIONADO: 'text-success',
  EN_PROCESO: 'text-warning',
  ESCALADO: 'text-danger',
}

/** Opciones del control segmentado de Estado, en orden del catálogo. */
export const ESTADO_OPCIONES: { value: EstadoAtencion; label: string }[] = [
  { value: 'SOLUCIONADO', label: ESTADO_LABEL.SOLUCIONADO },
  { value: 'EN_PROCESO', label: ESTADO_LABEL.EN_PROCESO },
  { value: 'ESCALADO', label: ESTADO_LABEL.ESCALADO },
]

/* ── Origen del problema · paleta categórica c1..c6 ────────────────────────── */

/** Token CSS de color categórico por índice (cíclico sobre 6). */
export function origenColorToken(indice: number): string {
  return `var(--color-cat-${(indice % 6) + 1})`
}

/** Donut de origen: segmentos acumulados con el token categórico de cada uno. */
export function origenDonutBg(origen: readonly OrigenItem[]): string {
  const suma = origen.reduce((acc, o) => acc + o.total, 0)
  if (suma <= 0) return 'var(--color-border-subtle)'
  let desde = 0
  const paradas = origen.map((o, i) => {
    const pct = (o.total / suma) * 100
    const ultimo = i === origen.length - 1
    const hasta = ultimo ? 100 : desde + pct
    const token = origenColorToken(i)
    const tramo = `${token} ${desde === 0 ? '0' : `${desde}%`} ${hasta}%`
    desde = hasta
    return tramo
  })
  return `conic-gradient(${paradas.join(', ')})`
}

/* ── Utilidades ────────────────────────────────────────────────────────────── */

/** Iniciales del avatar del operador (máx. 2), `?` si el nombre está vacío. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}
