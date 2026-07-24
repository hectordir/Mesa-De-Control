import type { SupervisionHeatmap } from '../../../lib/api/types'
import {
  ADMIN_HEX,
  deriveHeatmap,
  formatFechaCorta,
  heatCell,
  heatTotalBg,
  HEAT_LEGEND,
} from '../lib/admin.presentation'

/** Tabla zona × motivo con intensidad de color por celda + total por zona. */
export function HeatMapDiario({
  heatmap,
  fecha,
}: {
  heatmap: SupervisionHeatmap
  fecha: string
}) {
  const { motivos, filas } = deriveHeatmap(heatmap)

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-[18px] py-[15px]">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[13px]"
          style={{
            background: `color-mix(in srgb, ${ADMIN_HEX.warning} 15%, var(--color-surface))`,
            color: ADMIN_HEX.warning,
          }}
        >
          ◱
        </span>
        <div className="flex flex-col gap-[1px]">
          <h2 className="text-[15px] font-semibold tracking-[-.01em] text-text-primary">
            HeatMap Diario — Mapa de Calor Mesa de Control
          </h2>
          <div className="text-caption text-text-muted">
            Incidencias registradas, agrupadas por zona y motivo
          </div>
        </div>
        <span
          className="ml-auto rounded-control border px-[11px] py-[5px] text-caption font-bold"
          style={{
            color: ADMIN_HEX.info,
            background: `color-mix(in srgb, ${ADMIN_HEX.info} 14%, var(--color-surface))`,
            borderColor: `color-mix(in srgb, ${ADMIN_HEX.info} 32%, transparent)`,
          }}
        >
          {formatFechaCorta(fecha)}
        </span>
      </div>
      <div data-testid="heatmap-table-wrap">
        <table className="w-full table-fixed border-collapse text-body">
          <thead>
            <tr>
              <th className="w-[16%] border-b border-border bg-surface px-[18px] py-[11px] text-left text-[10px] font-semibold uppercase tracking-[.07em] text-text-muted">
                Zona
              </th>
              {motivos.map((m) => (
                <th
                  key={m}
                  title={m}
                  className="whitespace-normal border-b border-border bg-surface px-2 py-[11px] text-center text-[10px] font-semibold uppercase leading-tight tracking-[.05em] text-text-secondary"
                >
                  {m}
                </th>
              ))}
              <th className="w-[9%] border-b border-border bg-surface px-2 py-[11px] text-center text-[10px] font-bold uppercase tracking-[.07em] text-brand">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map((r) => (
              <tr key={r.zona}>
                <td
                  title={r.zona}
                  className="h-[44px] truncate border-b border-border-subtle bg-surface px-[18px] font-semibold text-text-primary"
                >
                  {r.zona}
                </td>
                {r.celdas.map((n, i) => {
                  const cell = heatCell(n)
                  return (
                    <td
                      key={`${r.zona}-${i}`}
                      className="h-[44px] border-b border-l border-border-subtle text-center font-semibold"
                      style={{ background: cell.bg, color: cell.color }}
                    >
                      {n}
                    </td>
                  )
                })}
                <td
                  className="h-[44px] border-b border-l border-border text-center font-bold text-text-primary"
                  style={{ background: heatTotalBg(r.total) }}
                >
                  {r.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-[14px] border-t border-border-subtle px-[18px] py-[13px]">
        <span className="text-[11px] font-semibold uppercase tracking-[.05em] text-text-muted">
          Intensidad
        </span>
        {HEAT_LEGEND.map((l) => (
          <span
            key={l.label}
            className="inline-flex items-center gap-[6px] text-caption font-semibold text-text-secondary"
          >
            <span
              className="h-[14px] w-[14px] rounded-[4px]"
              style={{
                background: `color-mix(in srgb, ${l.hex} 45%, transparent)`,
                border: `1px solid color-mix(in srgb, ${l.hex} 55%, transparent)`,
              }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </section>
  )
}
