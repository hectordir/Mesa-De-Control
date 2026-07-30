import type { ActividadItem } from '../../../lib/api/types'
import { RadarIcon } from './icons'
import {
  EmptyState,
  Panel,
  Skeleton,
  SkeletonRows,
  type EstadoPanel,
} from './PanelStates'
import { RadarItem } from './RadarItem'

export interface RadarPanelProps {
  actividad: readonly ActividadItem[]
  estado: EstadoPanel
}

function EnVivo() {
  return (
    <span className="inline-flex items-center gap-[6px] text-label font-semibold text-success">
      <span
        aria-hidden="true"
        className="h-[7px] w-[7px] rounded-pill bg-success fx-pulse"
      />
      En vivo
    </span>
  )
}

export function RadarPanel({ actividad, estado }: RadarPanelProps) {
  return (
    <Panel
      titulo="Radar de Operaciones"
      subtitulo="Actividad del equipo en tiempo real"
      estado={estado}
      accion={<EnVivo />}
    >
      {estado === 'data' ? (
        // Alto clavado a las 5 barras de "Top 5 Averías" (~258px), su vecino de
        // fila: el tope evita que el radar se descuelgue (el quinto item queda
        // cortado, pista de que la lista tiene scroll propio) y el mínimo evita
        // que encoja con listas cortas.
        <div className="am-scroll max-h-[260px] min-h-[260px] overflow-y-auto [scrollbar-gutter:stable]">
          <ul className="px-4 pb-4 pt-2">
            {actividad.map((item) => (
              <RadarItem key={item.id} actividad={item} />
            ))}
          </ul>
        </div>
      ) : null}

      {estado === 'empty' ? (
        <EmptyState
          icono={<RadarIcon />}
          titulo="Sin actividad reciente"
          descripcion="El radar mostrará cada acción del equipo en cuanto comiencen las gestiones."
          minHeight="min-h-[230px]"
        />
      ) : null}

      {estado === 'loading' ? (
        <div className="min-h-[230px] px-4 pb-4 pt-2">
          <SkeletonRows>
            {() => (
              <div className="flex gap-3 border-b border-border-subtle py-[11px]">
                <Skeleton className="h-8 w-8 flex-shrink-0 rounded-pill" />
                <div className="flex flex-1 flex-col justify-center gap-[6px]">
                  <Skeleton className="h-[11px] w-4/5 rounded-chip" />
                  <Skeleton className="h-[9px] w-[45%] rounded-[5px]" />
                </div>
              </div>
            )}
          </SkeletonRows>
        </div>
      ) : null}
    </Panel>
  )
}
