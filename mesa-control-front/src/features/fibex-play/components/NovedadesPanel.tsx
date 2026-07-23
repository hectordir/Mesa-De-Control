import { Badge } from '../../../components/ui'
import { cx } from '../../../components/ui/cx'
import type { FibexPlayKpis, FallaCanal } from '../../../lib/api/types'
import { Panel } from '../../dashboard/components/PanelStates'
import {
  CATEGORIA_LABEL,
  INCIDENCIA_LABEL,
  SEVERIDAD_DOT,
  SEVERIDAD_LABEL,
  SEVERIDAD_TONE,
} from '../lib/fibexPlay.presentation'

interface NovedadesPanelProps {
  kpis: FibexPlayKpis
  fallas: FallaCanal[]
  /** ISO instante del último sondeo. */
  actualizadoEn: string
}

/** HH:mm del instante, con la zona del navegador; vacío si no es una fecha. */
function horaSondeo(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

/** Fecha larga (día de la semana + fecha) del instante. */
function fechaLarga(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

/** Timeline de incidencias en vivo, o panel de éxito con la grilla operativa. */
export function NovedadesPanel({
  kpis,
  fallas,
  actualizadoEn,
}: NovedadesPanelProps) {
  const hayFallas = fallas.length > 0
  return (
    <Panel
      titulo="Reporte de Novedades"
      subtitulo={fechaLarga(actualizadoEn)}
      estado="data"
      accion={
        <span className="inline-flex items-center gap-[6px] text-caption font-medium text-text-secondary">
          <span
            aria-hidden="true"
            className={cx(
              'h-[7px] w-[7px] animate-pulse rounded-pill',
              hayFallas ? 'bg-danger' : 'bg-success',
            )}
          />
          Monitoreo en vivo
        </span>
      }
    >
      {hayFallas ? (
        <ol className="flex flex-col gap-4 p-5">
          {fallas.map((falla) => (
            <li key={falla.id} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cx(
                  'mt-[5px] h-[10px] w-[10px] flex-shrink-0 rounded-pill',
                  SEVERIDAD_DOT[falla.severidad],
                )}
              />
              <div className="flex min-w-0 flex-col gap-[2px]">
                <span className="text-[14px] font-semibold text-text-primary">
                  {falla.nombre} — {INCIDENCIA_LABEL[falla.tipoIncidencia]}
                </span>
                <span className="text-caption text-text-muted">
                  {CATEGORIA_LABEL[falla.categoria]}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={SEVERIDAD_TONE[falla.severidad]}>
                    {SEVERIDAD_LABEL[falla.severidad]}
                  </Badge>
                  <span className="tabular text-caption text-text-muted">
                    {falla.hora}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <span
            aria-hidden="true"
            className="flex h-[64px] w-[64px] items-center justify-center rounded-pill bg-success-soft text-[30px] font-bold text-success"
          >
            ✓
          </span>
          <p className="text-[16px] font-semibold text-success">
            Grilla 100% operativa
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col">
              <span className="tabular text-[22px] font-bold text-text-primary">
                {kpis.operativos}
              </span>
              <span className="text-caption text-text-muted">operativos</span>
            </div>
            <div className="flex flex-col">
              <span className="tabular text-[22px] font-bold text-text-primary">
                {kpis.caidos}
              </span>
              <span className="text-caption text-text-muted">incidencias</span>
            </div>
            <div className="flex flex-col">
              <span className="tabular text-[22px] font-bold text-text-primary">
                {horaSondeo(actualizadoEn)}
              </span>
              <span className="text-caption text-text-muted">último sondeo</span>
            </div>
          </div>
        </div>
      )}
    </Panel>
  )
}
