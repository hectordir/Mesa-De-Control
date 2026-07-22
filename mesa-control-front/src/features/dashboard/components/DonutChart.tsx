import { conicGradient, type SegmentoDonut } from '../derive'

export interface DonutChartProps {
  segmentos: readonly SegmentoDonut[]
  total: number
}

/** Donut resuelto con un `conic-gradient` calculado: sin librería de charts. */
export function DonutChart({ segmentos, total }: DonutChartProps) {
  return (
    <div
      role="img"
      aria-label={`Distribución de ${total} gestiones`}
      className="relative h-[172px] w-[172px] flex-shrink-0 rounded-pill"
      style={{ background: conicGradient(segmentos) }}
    >
      <div className="absolute inset-[26px] flex flex-col items-center justify-center gap-[2px] rounded-pill bg-surface shadow-[inset_0_0_0_1px_var(--color-border-subtle)]">
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
