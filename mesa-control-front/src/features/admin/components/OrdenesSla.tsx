import type { SupervisionSlaBucket } from '../../../lib/api/types'
import { ADMIN_HEX, slaColor, slaRowTint } from '../lib/admin.presentation'

/** Órdenes pendientes por antigüedad (SLA) con el total. */
export function OrdenesSla({ sla }: { sla: SupervisionSlaBucket[] }) {
  const total = sla.reduce((a, r) => a + r.count, 0)

  return (
    <section className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
      <div className="flex items-center gap-[10px] border-b border-border-subtle px-[18px] py-[15px]">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[13px]"
          style={{
            background: `color-mix(in srgb, ${ADMIN_HEX.warning} 15%, var(--color-surface))`,
            color: ADMIN_HEX.warning,
          }}
        >
          ⏱
        </span>
        <h2 className="text-[15px] font-semibold tracking-[-.01em] text-text-primary">
          Órdenes / SLA
        </h2>
      </div>
      <div className="grid grid-cols-[1fr_auto] border-b border-border-subtle px-[18px] py-[9px]">
        <span className="text-[10px] font-semibold uppercase tracking-[.08em] text-text-muted">
          Días Pendientes
        </span>
        <span className="text-right text-[10px] font-semibold uppercase tracking-[.08em] text-text-muted">
          Cantidad
        </span>
      </div>
      <div className="flex flex-1 flex-col">
        {sla.map((r) => (
          <div
            key={r.key}
            className="grid flex-1 grid-cols-[1fr_auto] items-center gap-3 border-b border-border-subtle px-[18px]"
            style={{ background: slaRowTint(r.key), borderLeft: `3px solid ${slaColor(r.key)}` }}
          >
            <span className="text-body font-semibold" style={{ color: slaColor(r.key) }}>
              {r.label}
            </span>
            <span className="text-right text-[20px] font-bold text-text-primary">
              {r.count}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto] items-center gap-3 bg-bg px-[18px] py-4">
          <span className="text-label uppercase text-text-secondary">
            Total pendientes
          </span>
          <span className="text-right text-[26px] font-bold text-text-primary">
            {total}
          </span>
        </div>
      </div>
    </section>
  )
}
