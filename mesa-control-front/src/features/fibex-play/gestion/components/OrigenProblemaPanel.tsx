import type { OrigenItem } from '../../../../lib/api/types'
import { EmptyState, Panel } from '../../../dashboard/components/PanelStates'
import { origenColorToken, origenDonutBg } from '../lib/gestion.presentation'

/** Donut de clasificación por origen del problema + leyenda categórica. */
export function OrigenProblemaPanel({ origen }: { origen: OrigenItem[] }) {
  const hayDatos = origen.length > 0
  const total = origen.reduce((acc, o) => acc + o.total, 0)
  return (
    <Panel
      titulo="Origen del Problema"
      subtitulo="Clasificación de los reportes atendidos"
      estado="data"
    >
      {hayDatos ? (
        <div className="flex flex-wrap items-center gap-6 p-5">
          <div
            role="img"
            aria-label={`Distribución de ${total} reportes por origen`}
            className="relative h-[160px] w-[160px] flex-shrink-0 rounded-pill"
            style={{ background: origenDonutBg(origen) }}
          >
            <div className="absolute inset-[24px] flex flex-col items-center justify-center gap-[2px] rounded-pill bg-surface">
              <span className="tabular text-[28px] font-bold leading-none tracking-[-.02em] text-text-primary">
                {total}
              </span>
              <span className="text-label uppercase tracking-[.05em] text-text-muted">
                reportes
              </span>
            </div>
          </div>
          <ul className="flex flex-1 flex-col gap-3">
            {origen.map((o, indice) => (
              <li key={o.origen} className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-[10px] w-[10px] flex-shrink-0 rounded-pill"
                  style={{ background: origenColorToken(indice) }}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">
                  {o.origen}
                </span>
                <span className="tabular text-[14px] font-semibold text-text-primary">
                  {o.total}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          icono={<span className="text-[20px]">◐</span>}
          titulo="Sin datos de origen"
          descripcion="Aún no hay reportes clasificados por origen del problema."
          marco="anillo"
          minHeight="min-h-[200px]"
        />
      )}
    </Panel>
  )
}
