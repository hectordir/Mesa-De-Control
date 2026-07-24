import type { SupervisionKpis } from '../../../lib/api/types'
import { buildKpis, formatFechaLarga } from '../lib/admin.presentation'

/** 4 tarjetas KPI del día (Atendidos, Efectividad, Escalados NOC, SLA). */
export function ResumenOperativo({
  kpis,
  fecha,
}: {
  kpis: SupervisionKpis
  fecha: string
}) {
  const cards = buildKpis(kpis)
  return (
    <section aria-label="Resumen Operativo" className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[10px]">
        <span className="h-[18px] w-[3px] rounded-[2px] bg-brand" />
        <h2 className="text-[16px] font-semibold tracking-[-.01em] text-text-primary">
          Resumen Operativo{' '}
          <span className="font-medium text-text-muted">
            · {formatFechaLarga(fecha)}
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        {cards.map((k) => (
          <div
            key={k.label}
            className="flex flex-col gap-[14px] rounded-card border border-border bg-surface p-[18px] shadow-elevation"
          >
            <div className="flex items-center justify-between gap-[10px]">
              <span className="text-label uppercase text-text-secondary">
                {k.label}
              </span>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[15px]"
                style={{ background: k.tint, color: k.color }}
              >
                {k.icon}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[34px] font-bold leading-none tracking-[-.02em] text-text-primary">
                {k.value}
              </span>
              {k.unit ? (
                <span className="text-[14px] font-semibold text-text-muted">
                  {k.unit}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-pill px-2 py-[2px] text-[11px] font-semibold"
                style={{ background: k.tint, color: k.color }}
              >
                {k.delta}
              </span>
              <span className="text-[11px] text-text-muted">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
