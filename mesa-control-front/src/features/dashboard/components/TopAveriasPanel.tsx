import type { AveriaItem } from '../../../lib/api/types'
import { ANCHOS_SKELETON } from '../derive'
import { AveriaBar } from './AveriaBar'
import { BarsIcon } from './icons'
import {
  EmptyState,
  Panel,
  Skeleton,
  SkeletonRows,
  type EstadoPanel,
} from './PanelStates'

export interface TopAveriasPanelProps {
  averias: readonly AveriaItem[]
  estado: EstadoPanel
}

export function TopAveriasPanel({ averias, estado }: TopAveriasPanelProps) {
  const maximo = averias.reduce((acc, a) => Math.max(acc, a.total), 0)

  return (
    <Panel
      titulo="Top 5 Averías"
      subtitulo="Motivos con mayor volumen hoy"
      estado={estado}
    >
      {estado === 'data' ? (
        // 260px de mínimo (los que ocupan las 5 barras) + 75px de cabecera =
        // los 335px que mide la fila con datos abundantes: con listas cortas el
        // panel ya no encoge y la fila 2 conserva su altura.
        <div className="flex min-h-[260px] flex-col gap-[14px] p-4">
          {averias.map((averia) => (
            <AveriaBar key={averia.motivo} averia={averia} maximo={maximo} />
          ))}
        </div>
      ) : null}

      {estado === 'empty' ? (
        <EmptyState
          icono={<BarsIcon />}
          titulo="Sin averías registradas hoy"
          descripcion="Los motivos más reportados se ordenarán aquí conforme entren gestiones."
          minHeight="min-h-[230px]"
        />
      ) : null}

      {estado === 'loading' ? (
        <div className="flex min-h-[230px] flex-col gap-[18px] p-4">
          <SkeletonRows>
            {(indice) => (
              <div className="flex flex-col gap-[6px]">
                <Skeleton className="h-[11px] w-1/2 rounded-chip" />
                <span
                  aria-hidden="true"
                  className="block h-[9px] rounded-[5px] fx-skeleton"
                  style={{ width: `${ANCHOS_SKELETON[indice]}%` }}
                />
              </div>
            )}
          </SkeletonRows>
        </div>
      ) : null}
    </Panel>
  )
}
