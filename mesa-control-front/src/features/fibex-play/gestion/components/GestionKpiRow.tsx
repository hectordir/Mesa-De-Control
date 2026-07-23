import type { GestionKpis } from '../../../../lib/api/types'
import { GestionKpiCard } from './GestionKpiCard'

/** Fila de las tres KPI de la bitácora: Total / Solucionados / Escalados. */
export function GestionKpiRow({ kpis }: { kpis: GestionKpis }) {
  return (
    <section
      aria-label="Indicadores de la bitácora"
      className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4"
    >
      <GestionKpiCard
        label="Total Atendidos"
        valor={kpis.totalAtendidos}
        subtitulo="reportes atendidos por la App"
        icono="▤"
        acento="brand"
      />
      <GestionKpiCard
        label="Solucionados"
        valor={kpis.solucionados}
        subtitulo="resueltos en la mesa"
        icono="✓"
        acento="success"
      />
      <GestionKpiCard
        label="Escalados"
        valor={kpis.escalados}
        subtitulo="derivados a otro nivel"
        icono="⚠"
        acento="danger"
      />
    </section>
  )
}
