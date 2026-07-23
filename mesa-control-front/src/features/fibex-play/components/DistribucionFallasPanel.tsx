import { cx } from '../../../components/ui/cx'
import type { DistribucionSeveridadItem } from '../../../lib/api/types'
import { Panel } from '../../dashboard/components/PanelStates'
import {
  SEVERIDAD_DOT,
  SEVERIDAD_LABEL,
} from '../lib/fibexPlay.presentation'
import { SeverityDonut } from './SeverityDonut'

interface DistribucionFallasPanelProps {
  distribucion: DistribucionSeveridadItem[]
  caidos: number
}

/** Donut por severidad, o estado 100 % estable cuando no hay fallas. */
export function DistribucionFallasPanel({
  distribucion,
  caidos,
}: DistribucionFallasPanelProps) {
  const hayFallas = caidos > 0
  return (
    <Panel
      titulo="Distribución de Fallas"
      subtitulo="Severidad de las incidencias activas"
      estado="data"
    >
      {hayFallas ? (
        <div className="flex flex-wrap items-center gap-6 p-5">
          <SeverityDonut distribucion={distribucion} totalCaidos={caidos} />
          <ul className="flex flex-1 flex-col gap-3">
            {distribucion.map((d) => (
              <li key={d.severidad} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={cx(
                    'h-[10px] w-[10px] flex-shrink-0 rounded-pill',
                    SEVERIDAD_DOT[d.severidad],
                  )}
                />
                <span className="text-[13px] text-text-secondary">
                  {SEVERIDAD_LABEL[d.severidad]}
                </span>
                <span className="tabular ml-auto text-[14px] font-semibold text-text-primary">
                  {d.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
          <div
            aria-hidden="true"
            className="flex h-[88px] w-[88px] items-center justify-center rounded-pill border-8 border-success text-[26px] font-bold text-success"
          >
            ✓
          </div>
          <p className="text-[14px] font-semibold text-success">100% estable</p>
          <p className="max-w-[240px] text-caption leading-[1.5] text-text-muted">
            Grilla 100% estable
          </p>
        </div>
      )}
    </Panel>
  )
}
