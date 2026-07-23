import { vacioFibexPlay } from '../../lib/api/fibex-play'
import { AppTopBar } from '../dashboard/components/AppTopBar'
import { Skeleton } from '../dashboard/components/PanelStates'
import { DetallesFallaPanel } from './components/DetallesFallaPanel'
import { DistribucionFallasPanel } from './components/DistribucionFallasPanel'
import { FibexPlayHeader } from './components/FibexPlayHeader'
import { GrillaKpiRow } from './components/GrillaKpiRow'
import { NovedadesPanel } from './components/NovedadesPanel'
import { useFibexPlay } from './hooks/useFibexPlay'

const REJILLA_PANELES =
  'grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-start gap-4'

/** Fibex Play · Grilla en Vivo: KPIs, distribución/detalle de fallas y novedades. */
export default function FibexPlayPage() {
  const { data, isPending } = useFibexPlay()
  const resumen = data ?? vacioFibexPlay()
  const { kpis } = resumen

  return (
    <div className="tabular flex min-h-screen flex-col gap-5 bg-bg p-6 font-sans text-text-primary">
      <AppTopBar />
      <FibexPlayHeader caidos={kpis.caidos} />

      {isPending ? (
        <section aria-label="Indicadores de la grilla" aria-busy="true">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[132px] rounded-card" />
            ))}
          </div>
        </section>
      ) : (
        <>
          <GrillaKpiRow kpis={kpis} />

          <div className={REJILLA_PANELES}>
            <DistribucionFallasPanel
              distribucion={resumen.distribucionSeveridad}
              caidos={kpis.caidos}
            />
            <DetallesFallaPanel fallas={resumen.fallas} />
          </div>

          <NovedadesPanel
            kpis={kpis}
            fallas={resumen.fallas}
            actualizadoEn={resumen.actualizadoEn}
          />
        </>
      )}
    </div>
  )
}
