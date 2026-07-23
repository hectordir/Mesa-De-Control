import type { Atendidos } from '../analisis-mensual.derive'
import { AT_H } from '../analisis-mensual.derive'
import { Panel } from './PanelStates'

/** Barras verticales de clientes atendidos por motivo, con eje y tooltip. */
export function AttendedClientsPanel({ atendidos }: { atendidos: Atendidos }) {
  return (
    <Panel
      titulo="Total de Clientes Atendidos"
      subtitulo="Clientes atendidos por tipo de motivo"
      estado="data"
    >
      <div className="px-5 pb-3 pt-5">
        <div className="flex gap-3">
          <div
            className="relative w-8 flex-shrink-0"
            style={{ height: `${AT_H}px` }}
          >
            {atendidos.ticks.map((t) => (
              <span
                key={t.value}
                className="tabular absolute right-0 translate-y-1/2 text-[10.5px] text-text-muted"
                style={{ bottom: `${t.bottom}px` }}
              >
                {t.label}
              </span>
            ))}
          </div>
          <div
            className="relative min-w-0 flex-1"
            style={{ height: `${AT_H}px` }}
          >
            <div aria-hidden="true" className="absolute inset-0">
              {atendidos.ticks.map((t) => (
                <span
                  key={t.value}
                  className="absolute left-0 right-0 h-px bg-border-subtle"
                  style={{ bottom: `${t.bottom}px` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-end justify-between gap-[6px]">
              {atendidos.barras.map((b) => (
                <figure
                  key={b.label}
                  aria-label={`${b.label}: ${b.total}`}
                  className="group relative flex min-w-0 flex-1 cursor-default flex-col items-center"
                >
                  <span className="tabular mb-[3px] text-[11px] font-bold text-text-secondary">
                    {b.total}
                  </span>
                  <span
                    aria-hidden="true"
                    className="block w-full max-w-[34px] rounded-t-[5px] transition-[filter] duration-150 group-hover:brightness-110"
                    style={{ height: `${b.px}px`, background: b.color }}
                  />
                </figure>
              ))}
            </div>
          </div>
        </div>
        <div className="ml-11 mt-2 flex gap-[6px]">
          {atendidos.barras.map((b) => (
            <span
              key={b.label}
              className="min-w-0 flex-1 text-center text-[9.5px] leading-[1.25] text-text-muted"
            >
              {b.label}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  )
}
