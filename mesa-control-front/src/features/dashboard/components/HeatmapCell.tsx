import { cx } from '../../../components/ui/cx'

/** Intensidad mínima visible y recorrido de la rampa (ver diseño). */
const BASE = 0.16
const RECORRIDO = 0.8
/** A partir de aquí el fondo es oscuro y el número necesita texto claro. */
const UMBRAL_TEXTO = 0.42

export interface HeatmapCellProps {
  /** Incidencias de la celda. */
  v: number
  /** Intensidad normalizada 0–1. */
  t: number
  /** La columna Total lleva más peso tipográfico y separador propio. */
  esTotal?: boolean
}

/**
 * Celda del mapa de calor. La rampa es un `color-mix` sobre el fondo del mapa,
 * así que sigue los tokens del tema activo (claro y oscuro).
 */
export function HeatmapCell({ v, t, esTotal = false }: HeatmapCellProps) {
  const vacia = v <= 0
  const porcentaje = Math.round((BASE + t * RECORRIDO) * 100)

  return (
    <td
      className={cx(
        'tabular border-b border-map-grid text-center',
        esTotal
          ? 'border-l border-border-subtle px-[14px] py-[9px] font-bold'
          : 'px-3 py-[9px] font-semibold',
        vacia
          ? 'text-text-muted'
          : t > UMBRAL_TEXTO
            ? 'text-brand-fg'
            : 'text-text-secondary',
      )}
      style={{
        background: vacia
          ? 'var(--color-map-bg)'
          : `color-mix(in srgb, var(--color-brand) ${porcentaje}%, var(--color-map-bg))`,
      }}
    >
      {v}
    </td>
  )
}
