import type { TopCanalItem } from '../../../../lib/api/types'
import { EmptyState, Panel } from '../../../dashboard/components/PanelStates'

/** Ranking de canales reportados con barra de progreso proporcional al máximo. */
export function TopCanalesPanel({ canales }: { canales: TopCanalItem[] }) {
  const hayDatos = canales.length > 0
  const maximo = hayDatos ? Math.max(...canales.map((c) => c.total)) : 0
  return (
    <Panel
      titulo="Top Canales Reportados (App Fibex)"
      subtitulo="Ranking de canales con más reportes"
      estado="data"
    >
      {hayDatos ? (
        <ul className="flex flex-col gap-4 p-5">
          {canales.map((c, indice) => (
            <li key={c.canal} className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="tabular flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-chip bg-brand-soft text-[12px] font-semibold text-brand">
                  {indice + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-text-primary">
                  {c.canal}
                </span>
                <span className="tabular text-[14px] font-semibold text-text-primary">
                  {c.total}
                </span>
              </div>
              <div className="h-[6px] w-full overflow-hidden rounded-pill bg-border-subtle">
                <div
                  className="h-full rounded-pill bg-brand"
                  style={{
                    width: `${maximo > 0 ? (c.total / maximo) * 100 : 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icono={<span className="text-[20px]">▤</span>}
          titulo="Sin canales reportados"
          descripcion="Aún no hay reportes de canales por la App Fibex."
          minHeight="min-h-[200px]"
        />
      )}
    </Panel>
  )
}
