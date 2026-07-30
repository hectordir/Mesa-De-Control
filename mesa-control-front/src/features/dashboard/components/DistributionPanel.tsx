import type { DistribucionItem } from '../../../lib/api/types'
import { segmentosDonut } from '../derive'
import { DonutChart } from './DonutChart'
import { DonutLegend } from './DonutLegend'
import {
  EmptyState,
  Panel,
  Skeleton,
  SkeletonRows,
  type EstadoPanel,
} from './PanelStates'

export interface DistributionPanelProps {
  distribucion: readonly DistribucionItem[]
  estado: EstadoPanel
}

export function DistributionPanel({
  distribucion,
  estado,
}: DistributionPanelProps) {
  const segmentos = segmentosDonut(distribucion)
  const total = distribucion.reduce((acc, d) => acc + d.total, 0)

  return (
    <Panel
      titulo="Distribución de resultados"
      subtitulo="Cómo se cerró cada gestión"
      estado={estado}
    >
      {estado === 'data' ? (
        // `flex-1`: el cuerpo llega al fondo del panel estirado y la dona se
        // come ese alto (`h-full`), en vez de dejar hueco muerto bajo la leyenda.
        <div className="flex flex-1 flex-wrap items-center justify-center gap-6 px-4 py-5">
          <DonutChart segmentos={segmentos} total={total} />
          <DonutLegend segmentos={segmentos} />
        </div>
      ) : null}

      {estado === 'empty' ? (
        <EmptyState
          marco="anillo"
          icono={null}
          titulo="Sin gestiones para graficar"
          descripcion="La distribución aparecerá cuando se cierre la primera gestión del día."
          minHeight="min-h-[280px]"
        />
      ) : null}

      {estado === 'loading' ? (
        <div className="flex min-h-[280px] items-center gap-6 px-4 py-5">
          <Skeleton className="h-[240px] w-[240px] flex-shrink-0 rounded-pill" />
          <div className="flex flex-1 flex-col gap-3">
            <SkeletonRows>
              {() => <Skeleton className="h-[11px] rounded-chip" />}
            </SkeletonRows>
          </div>
        </div>
      ) : null}
    </Panel>
  )
}
