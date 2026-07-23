import { Badge } from '../../../components/ui'
import type { FallaCanal } from '../../../lib/api/types'
import { EmptyState, Panel } from '../../dashboard/components/PanelStates'
import {
  CATEGORIA_LABEL,
  INCIDENCIA_LABEL,
  SEVERIDAD_LABEL,
  SEVERIDAD_TONE,
} from '../lib/fibexPlay.presentation'

/** Lista de canales caídos, o estado "Sin detalles" cuando la grilla está sana. */
export function DetallesFallaPanel({ fallas }: { fallas: FallaCanal[] }) {
  const hayFallas = fallas.length > 0
  return (
    <Panel
      titulo="Detalles de Falla"
      subtitulo="Canales con incidencia activa"
      estado="data"
      accion={hayFallas ? <Badge tone="danger">{fallas.length} activas</Badge> : undefined}
    >
      {hayFallas ? (
        <ul className="flex flex-col divide-y divide-border-subtle">
          {fallas.map((falla, indice) => (
            <li key={falla.id} className="flex items-center gap-3 p-4">
              <span className="tabular flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-chip bg-danger-soft text-[12px] font-semibold text-danger">
                {indice + 1}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] font-semibold text-text-primary">
                  {falla.nombre}
                </span>
                <span className="truncate text-caption text-text-muted">
                  {CATEGORIA_LABEL[falla.categoria]} ·{' '}
                  {INCIDENCIA_LABEL[falla.tipoIncidencia]}
                </span>
              </div>
              <Badge tone={SEVERIDAD_TONE[falla.severidad]} className="ml-auto">
                {SEVERIDAD_LABEL[falla.severidad]}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icono={<span className="text-[20px]">✓</span>}
          titulo="Sin detalles"
          descripcion="No hay canales con incidencia; la grilla opera con normalidad."
          minHeight="min-h-[200px]"
        />
      )}
    </Panel>
  )
}
