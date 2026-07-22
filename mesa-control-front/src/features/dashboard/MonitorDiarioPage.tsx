import { Button } from '../../components/ui'
import { AppTopBar } from './components/AppTopBar'
import { DistributionPanel } from './components/DistributionPanel'
import { KpiRow } from './components/KpiRow'
import { OperatorsPanel } from './components/OperatorsPanel'
import type { EstadoPanel } from './components/PanelStates'
import { PageHeader } from './components/PageHeader'
import { RadarPanel } from './components/RadarPanel'
import { TopAveriasPanel } from './components/TopAveriasPanel'
import { useMonitorDiario } from './hooks/useMonitorDiario'
import { useOperationDay } from './hooks/useOperationDay'

const REJILLA_PANELES =
  'grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-start gap-4'

/** Vista operativa del día: KPIs, operadores, distribución, averías y radar. */
export default function MonitorDiarioPage() {
  const dia = useOperationDay()
  const { data, isPending, isError, refetch } = useMonitorDiario(dia.fecha)

  const estado: EstadoPanel = isPending
    ? 'loading'
    : data && data.kpis.clientesAtendidos === 0
      ? 'empty'
      : 'data'

  return (
    <div className="tabular flex min-h-screen flex-col gap-5 bg-bg p-6 font-sans text-text-primary">
      <AppTopBar />
      <PageHeader dia={dia} />

      {isError ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-3 rounded-card border border-danger bg-surface p-8 text-center shadow-elevation"
        >
          <p className="text-[14px] font-semibold text-danger">
            No se pudieron cargar los datos del monitor
          </p>
          <p className="max-w-[320px] text-caption text-text-muted">
            Revisa tu conexión con el servidor y vuelve a intentarlo.
          </p>
          <Button variant="secondary" onClick={() => void refetch()}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          <KpiRow kpis={data?.kpis} estado={estado} />

          <div className={REJILLA_PANELES}>
            <OperatorsPanel operadores={data?.operadores ?? []} estado={estado} />
            <DistributionPanel
              distribucion={data?.distribucion ?? []}
              estado={estado}
            />
          </div>

          <div className={REJILLA_PANELES}>
            <TopAveriasPanel averias={data?.topAverias ?? []} estado={estado} />
            <RadarPanel actividad={data?.actividad ?? []} estado={estado} />
          </div>
        </>
      )}
    </div>
  )
}
