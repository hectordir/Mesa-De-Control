import type { DistribucionSeg } from '../analisis-mensual.derive'
import { donutBg, fmt } from '../analisis-mensual.derive'
import { Panel } from './PanelStates'

export interface RequestDistributionPanelProps {
  segmentos: readonly DistribucionSeg[]
  /** Volumen total del mes, al centro del donut. */
  total: number
}

/** Donut de participación por motivo, con leyenda de porcentajes. */
export function RequestDistributionPanel({
  segmentos,
  total,
}: RequestDistributionPanelProps) {
  return (
    <Panel
      titulo="Distribución de Solicitudes"
      subtitulo="Participación de cada motivo sobre el total del mes"
      estado="data"
    >
      <div className="flex flex-wrap items-center gap-[22px] p-5">
        <div
          role="img"
          aria-label={`Distribución de ${fmt(total)} solicitudes`}
          className="relative h-[200px] w-[200px] flex-shrink-0 rounded-pill"
          style={{ background: donutBg(segmentos) }}
        >
          <div className="absolute inset-[34px] flex flex-col items-center justify-center rounded-pill bg-surface">
            <span className="tabular text-[30px] font-bold leading-none tracking-[-.02em]">
              {fmt(total)}
            </span>
            <span className="mt-[2px] text-[11px] text-text-muted">
              solicitudes
            </span>
          </div>
        </div>
        <ul className="flex min-w-[170px] flex-1 flex-col gap-[7px]">
          {segmentos.map((s) => (
            <li key={s.label} className="flex items-center gap-[9px]">
              <span
                aria-hidden="true"
                className="h-[11px] w-[11px] flex-shrink-0 rounded-[3px]"
                style={{ background: s.color }}
              />
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-text-secondary">
                {s.label}
              </span>
              <span className="tabular text-[12.5px] font-bold text-text-primary">
                {s.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
