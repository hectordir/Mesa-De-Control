import type { TopOperador } from '../analisis-mensual.derive'
import { fmt } from '../analisis-mensual.derive'
import { Panel } from './PanelStates'

/** Podio de operadores del mes por volumen, con medalla y eficiencia. */
export function TopOperatorsPanel({ top }: { top: readonly TopOperador[] }) {
  return (
    <Panel
      titulo="Top Operadores del Mes"
      subtitulo="Ranking por eficiencia de resolución"
      estado="data"
    >
      <div className="flex flex-col gap-2 p-[14px]">
        {top.map((o) => (
          <div
            key={o.id}
            className="flex items-center gap-[14px] rounded-[11px] border border-border-subtle bg-bg px-[14px] py-3"
          >
            <span
              className="tabular min-w-[26px] text-[15px] font-extrabold"
              style={{ color: o.medal }}
            >
              #{o.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-text-primary">{o.nombre}</p>
              <p className="tabular text-[11.5px] text-text-muted">
                {fmt(o.total)} gestiones
              </p>
            </div>
            <div className="text-right">
              <p className="tabular text-[16px] font-bold text-success">
                {o.eficiencia}%
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[.05em] text-text-muted">
                Eficiencia
              </p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
