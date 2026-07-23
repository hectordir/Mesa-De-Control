import { useState } from 'react'
import { vacioGestion } from '../../../lib/api/fibex-play-gestion'
import { AppTopBar } from '../../dashboard/components/AppTopBar'
import { Skeleton } from '../../dashboard/components/PanelStates'
import { FibexPlayToggle } from '../components/FibexPlayToggle'
import { BitacoraPanel } from './components/BitacoraPanel'
import { GestionKpiRow } from './components/GestionKpiRow'
import { NuevoRegistroDrawer } from './components/NuevoRegistroDrawer'
import { OrigenProblemaPanel } from './components/OrigenProblemaPanel'
import { TopCanalesPanel } from './components/TopCanalesPanel'
import { useFibexPlayGestion } from './hooks/useFibexPlayGestion'

const REJILLA_PANELES =
  'grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-4'

/** Fibex Play · Gestión de Clientes: KPIs, paneles y bitácora de atención. */
export default function FibexPlayGestionPage() {
  const { data, isPending } = useFibexPlayGestion()
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const resumen = data ?? vacioGestion()

  return (
    <div className="tabular flex min-h-screen flex-col gap-5 bg-bg p-6 font-sans text-text-primary">
      <AppTopBar />

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold leading-tight tracking-[-.02em]">
            Fibex Play — Gestión de Clientes
          </h1>
          <p className="text-[13px] text-text-muted">
            Bitácora de atención a reportes de clientes por la App Fibex
          </p>
        </div>
        <FibexPlayToggle />
      </div>

      {isPending ? (
        <section aria-label="Indicadores de la bitácora" aria-busy="true">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[132px] rounded-card" />
            ))}
          </div>
        </section>
      ) : (
        <>
          <GestionKpiRow kpis={resumen.kpis} />

          <div className={REJILLA_PANELES}>
            <TopCanalesPanel canales={resumen.topCanales} />
            <OrigenProblemaPanel origen={resumen.origen} />
          </div>

          <BitacoraPanel
            registros={resumen.registros}
            onNuevo={() => setDrawerAbierto(true)}
          />
        </>
      )}

      <NuevoRegistroDrawer
        open={drawerAbierto}
        catalogos={resumen.catalogos}
        onClose={() => setDrawerAbierto(false)}
      />
    </div>
  )
}
