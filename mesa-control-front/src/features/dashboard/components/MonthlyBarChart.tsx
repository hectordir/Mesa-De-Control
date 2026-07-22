import type { Chart } from '../analisis-mensual.derive'
import { BarsIcon } from './icons'
import {
  BarColumn,
  ChartAxis,
  ChartGrid,
  ChartLegend,
} from './MonthlyBarChart.parts'
import { EmptyState, Panel, SkeletonRows, type EstadoPanel } from './PanelStates'

/** Alturas de los esqueletos de barra, como en el diseño. */
const ALTURAS_CARGA = [210, 288, 300, 96] as const

export interface MonthlyBarChartProps {
  chart: Chart
  estado: EstadoPanel
}

/** Barras apiladas resueltas vs. resto, sin librería de gráficos. */
export function MonthlyBarChart({ chart, estado }: MonthlyBarChartProps) {
  return (
    <Panel
      titulo="Gestiones por mes"
      subtitulo="Resueltas vs. resto del volumen · últimos 4 meses"
      estado={estado}
      accion={<ChartLegend />}
    >
      {estado === 'data' ? (
        <div className="px-5 pb-[42px] pt-[22px]">
          <div className="flex gap-[14px]">
            <ChartAxis ticks={chart.ticks} />
            <div className="relative h-[300px] flex-1">
              <ChartGrid ticks={chart.ticks} />
              <div className="absolute inset-0 flex items-end justify-around gap-6">
                {chart.bars.map((bar) => (
                  <BarColumn key={bar.periodo} bar={bar} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {estado === 'empty' ? (
        <EmptyState
          icono={<BarsIcon />}
          titulo="Sin datos para el mes seleccionado"
          descripcion="Elige un mes con gestiones registradas para ver la comparación de volumen."
          minHeight="min-h-[300px]"
        />
      ) : null}

      {estado === 'loading' ? (
        <div className="flex h-[344px] items-end justify-around gap-6 px-5 py-[22px]">
          <SkeletonRows count={ALTURAS_CARGA.length}>
            {(indice) => (
              <span
                aria-hidden="true"
                className="block w-[76px] max-w-full rounded-t-chip fx-skeleton"
                style={{ height: `${ALTURAS_CARGA[indice]}px` }}
              />
            )}
          </SkeletonRows>
        </div>
      ) : null}
    </Panel>
  )
}
