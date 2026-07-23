import type { FibexPlayKpis } from '../../../lib/api/types'
import { KpiCanalesCaidos } from './KpiCanalesCaidos'
import { KpiCanalesTotales } from './KpiCanalesTotales'
import { KpiSaludGrilla } from './KpiSaludGrilla'

/** Fila de las tres KPI de la grilla. */
export function GrillaKpiRow({ kpis }: { kpis: FibexPlayKpis }) {
  return (
    <section
      aria-label="Indicadores de la grilla"
      className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4"
    >
      <KpiCanalesTotales total={kpis.total} />
      <KpiSaludGrilla saludGrilla={kpis.saludGrilla} operativos={kpis.operativos} />
      <KpiCanalesCaidos caidos={kpis.caidos} />
    </section>
  )
}
