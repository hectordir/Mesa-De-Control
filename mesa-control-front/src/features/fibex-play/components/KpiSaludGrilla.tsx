import { cx } from '../../../components/ui/cx'
import { saludMeta } from '../lib/fibexPlay.presentation'
import { HealthRing } from './HealthRing'

interface KpiSaludGrillaProps {
  /** 0–100. */
  saludGrilla: number
  operativos: number
}

/** KPI · salud de la grilla, con número coloreado y anillo. */
export function KpiSaludGrilla({ saludGrilla, operativos }: KpiSaludGrillaProps) {
  const meta = saludMeta(saludGrilla)
  return (
    <div
      role="group"
      aria-label="Salud de Grilla"
      className="flex items-center justify-between gap-4 rounded-card border border-border border-l-4 border-l-success bg-surface p-5 shadow-elevation"
    >
      <div className="flex flex-col gap-2">
        <span className="text-label uppercase tracking-[.06em] text-text-muted">
          Salud de Grilla
        </span>
        <span
          className={cx(
            'tabular text-[46px] font-bold leading-none tracking-[-.02em]',
            meta.text,
          )}
        >
          {saludGrilla}%
        </span>
        <span className="text-caption text-text-muted">
          {operativos} operativos
        </span>
      </div>
      <HealthRing health={saludGrilla} />
    </div>
  )
}
