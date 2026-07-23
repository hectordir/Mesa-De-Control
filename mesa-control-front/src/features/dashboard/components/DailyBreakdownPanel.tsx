import type { AnalisisMensualDia } from '../../../lib/api/types'
import { fmt } from '../analisis-mensual.derive'
import { Panel } from './PanelStates'

/** Tabla scrollable de atendidos por fecha, con cabecera fija. */
export function DailyBreakdownPanel({
  filas,
}: {
  filas: readonly AnalisisMensualDia[]
}) {
  return (
    <Panel
      titulo="Desglose de Cantidades"
      subtitulo="Atendidos por fecha"
      estado="data"
    >
      <div className="am-scroll max-h-[270px] overflow-auto">
        <table className="w-full border-separate border-spacing-0 text-[12.5px]">
          <caption className="sr-only">Desglose de cantidades atendidas por fecha</caption>
          <thead>
            <tr>
              <th className="sticky top-0 z-[2] border-b border-border bg-surface-elevated px-5 py-[10px] text-left text-[10.5px] font-bold uppercase tracking-[.05em] text-text-muted">
                Fecha
              </th>
              <th className="sticky top-0 z-[2] border-b border-border bg-surface-elevated px-5 py-[10px] text-right text-[10.5px] font-bold uppercase tracking-[.05em] text-text-muted">
                Atendidos
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => (
              <tr key={r.fecha}>
                <td className="border-b border-border-subtle px-5 py-[9px] font-semibold text-text-secondary">
                  {r.fecha}
                </td>
                <td className="border-b border-border-subtle px-5 py-[9px] text-right">
                  <span
                    className="tabular inline-block min-w-[34px] rounded-pill px-[9px] py-[3px] font-bold text-brand"
                    style={{
                      background: 'color-mix(in srgb, var(--color-brand) 14%, var(--color-surface))',
                      border: '1px solid color-mix(in srgb, var(--color-brand) 28%, transparent)',
                    }}
                  >
                    {fmt(r.atendidos)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
