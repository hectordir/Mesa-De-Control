import { AppTopBar } from './components/AppTopBar'
import { DistributionPanel } from './components/DistributionPanel'
import { KpiRow } from './components/KpiRow'
import { OperatorsPanel } from './components/OperatorsPanel'
import { OperationDatePicker } from './components/OperationDatePicker'
import { ErrorState, type EstadoPanel } from './components/PanelStates'
import { PageHeader } from './components/PageHeader'
import { RadarPanel } from './components/RadarPanel'
import { TopAveriasPanel } from './components/TopAveriasPanel'
import { useMonitorDiario } from './hooks/useMonitorDiario'
import { useOperationDay } from './hooks/useOperationDay'

const REJILLA = 'grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4'

/**
 * Fila 1: `items-stretch` porque su contenido sabe llenar el alto — la dona
 * crece con el panel en vez de dejar hueco bajo la leyenda.
 */
const REJILLA_PAREJA = `${REJILLA} items-stretch`

/**
 * Fila 2: `items-start`, cada panel mide lo que mide su contenido en vez de
 * estirarse a la altura de su vecino. Desparejos, pero sin hueco muerto.
 */
const REJILLA_PANELES = `${REJILLA} items-start`

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
      <PageHeader
        titulo="Monitor Diario"
        subtitulo={`Vista operativa de la mesa de control · ${dia.largo}`}
      >
        <OperationDatePicker dia={dia} />
      </PageHeader>

      {isError ? (
        <ErrorState
          titulo="No se pudieron cargar los datos del monitor"
          onReintentar={() => void refetch()}
        />
      ) : (
        <>
          <KpiRow kpis={data?.kpis} estado={estado} />

          <div className={REJILLA_PAREJA}>
            <OperatorsPanel
              operadores={data?.operadores ?? []}
              estado={estado}
            />
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
