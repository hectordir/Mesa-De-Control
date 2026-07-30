import { conicGradient, type SegmentoDonut } from '../derive'

export interface DonutChartProps {
  segmentos: readonly SegmentoDonut[]
  total: number
}

/**
 * Donut resuelto con un `conic-gradient` calculado: sin librería de charts.
 *
 * 240px (antes 172) para que el panel de distribución cierre a la misma altura
 * que el resumen por operador de su fila. Diámetro fijo y no porcentual: la
 * leyenda se envuelve debajo en columnas estrechas y un `h-full` la desbordaría.
 * El anillo va en `%` para escalar con el diámetro sin deformar el círculo.
 */
export function DonutChart({ segmentos, total }: DonutChartProps) {
  return (
    <div
      role="img"
      aria-label={`Distribución de ${total} gestiones`}
      className="relative h-[240px] w-[240px] flex-shrink-0 rounded-pill"
      style={{ background: conicGradient(segmentos) }}
    >
      <div className="absolute inset-[15%] flex flex-col items-center justify-center gap-[2px] rounded-pill bg-surface shadow-[inset_0_0_0_1px_var(--color-border-subtle)]">
        <span className="tabular text-[30px] font-bold leading-none tracking-[-.02em]">
          {total}
        </span>
        <span className="text-label uppercase tracking-[.05em] text-text-muted">
          gestiones
        </span>
      </div>
    </div>
  )
}
