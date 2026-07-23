import {
  buildChart,
  buildHeatmap,
  efectividad,
  fmt,
} from './analisis-mensual.derive'
import { AnalyticsBlock } from './components/AnalyticsBlock'
import { AppTopBar } from './components/AppTopBar'
import { DashboardViewToggle } from './components/DashboardViewToggle'
import { EffectivenessKpiCard } from './components/EffectivenessKpiCard'
import { AlertTriangleIcon, RowsIcon } from './components/icons'
import { IncidentHeatmap } from './components/IncidentHeatmap'
import { MonthFilter } from './components/MonthFilter'
import { MonthlyBarChart } from './components/MonthlyBarChart'
import { MonthlyKpiCard } from './components/MonthlyKpiCard'
import { ErrorState, type EstadoPanel } from './components/PanelStates'
import { useAnalisisMensual, vacioMensual } from './hooks/useAnalisisMensual'
import { useMonthFilter } from './hooks/useMonthFilter'

/** Vista consolidada del mes: KPIs, gestiones por mes y mapa de calor. */
export default function AnalisisMensualPage() {
  const mes = useMonthFilter()
  const { data, isPending, isError, refetch } = useAnalisisMensual(mes.periodo)

  const resumen = data ?? vacioMensual(mes.periodo)
  const { kpis } = resumen
  const estado: EstadoPanel = isPending
    ? 'loading'
    : kpis.volumen > 0
      ? 'data'
      : 'empty'
  const vacio = estado === 'empty'

  const chart = buildChart(resumen.serie)
  const heatmap = buildHeatmap(resumen.heatmap)

  return (
    <div className="tabular flex min-h-screen flex-col gap-5 bg-bg p-6 font-sans text-text-primary">
      <AppTopBar />

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold leading-tight tracking-[-.02em]">
            Análisis Mensual
          </h1>
          <p className="text-[13px] text-text-muted">
            Vista analítica y consolidada · {mes.etiqueta}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DashboardViewToggle />
          <MonthFilter mes={mes} />
        </div>
      </div>

      {isError ? (
        <ErrorState
          titulo="No se pudieron cargar los datos del mes"
          onReintentar={() => void refetch()}
        />
      ) : (
        <>
          <section
            aria-label="Indicadores del mes"
            aria-busy={estado === 'loading'}
            className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4"
          >
            <MonthlyKpiCard
              label="Volumen Mensual"
              icono={<RowsIcon size={16} />}
              tono="brand"
              valor={fmt(kpis.volumen)}
              meta={
                vacio
                  ? 'sin gestiones registradas'
                  : 'gestiones registradas en el mes'
              }
              cargando={estado === 'loading'}
              vacio={vacio}
            />
            <EffectivenessKpiCard
              efectividad={efectividad(kpis.volumen, kpis.resueltos)}
              resueltos={kpis.resueltos}
              meta={kpis.metaEfectividad}
              estado={estado}
            />
            <MonthlyKpiCard
              label="Escalados NOC"
              icono={<AlertTriangleIcon />}
              tono="danger"
              valor={fmt(kpis.escalados)}
              meta={vacio ? 'sin escalados' : 'casos derivados al NOC'}
              cargando={estado === 'loading'}
              vacio={vacio}
              anchoCarga="w-[40%]"
            />
          </section>

          <MonthlyBarChart chart={chart} estado={estado} />
          <IncidentHeatmap heatmap={heatmap} estado={estado} />
          <AnalyticsBlock resumen={resumen} estado={estado} />
        </>
      )}
    </div>
  )
}
