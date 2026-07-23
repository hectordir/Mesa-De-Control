import type { DistribucionSeveridadItem } from '../../../lib/api/types'
import { severityDonutBg } from '../lib/fibexPlay.presentation'

interface SeverityDonutProps {
  distribucion: readonly DistribucionSeveridadItem[]
  /** Total de canales caídos, mostrado en el centro. */
  totalCaidos: number
}

/** Donut (conic-gradient) por severidad con el total de caídos en el centro. */
export function SeverityDonut({ distribucion, totalCaidos }: SeverityDonutProps) {
  return (
    <div
      role="img"
      aria-label={`Distribución de ${totalCaidos} canales caídos por severidad`}
      className="relative h-[160px] w-[160px] flex-shrink-0 rounded-pill"
      style={{ background: severityDonutBg(distribucion) }}
    >
      <div className="absolute inset-[24px] flex flex-col items-center justify-center gap-[2px] rounded-pill bg-surface">
        <span className="tabular text-[28px] font-bold leading-none tracking-[-.02em] text-danger">
          {totalCaidos}
        </span>
        <span className="text-label uppercase tracking-[.05em] text-text-muted">
          caídos
        </span>
      </div>
    </div>
  )
}
