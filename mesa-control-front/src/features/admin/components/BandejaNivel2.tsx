import type { SupervisionBandejaItem } from '../../../lib/api/types'
import {
  ADMIN_HEX,
  diasColor,
  diasLabel,
  estadoHex,
  estadoTint,
} from '../lib/admin.presentation'

/** Bandeja de escalados a Nivel 2 / NOC, con estado vacío "¡Todo limpio!". */
export function BandejaNivel2({ items }: { items: SupervisionBandejaItem[] }) {
  const count = items.length
  const badgeHex = count ? ADMIN_HEX.danger : ADMIN_HEX.success

  return (
    <section className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
      <div className="flex items-center gap-[10px] border-b border-border-subtle px-[18px] py-[15px]">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[13px]"
          style={{
            background: `color-mix(in srgb, ${ADMIN_HEX.danger} 15%, var(--color-surface))`,
            color: ADMIN_HEX.danger,
          }}
        >
          ⚑
        </span>
        <h2 className="text-[15px] font-semibold tracking-[-.01em] text-text-primary">
          Bandeja Nivel 2{' '}
          <span className="font-medium text-text-muted">· Pendientes</span>
        </h2>
        <span
          className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-pill px-[7px] text-caption font-bold"
          style={{
            color: badgeHex,
            background: `color-mix(in srgb, ${badgeHex} 18%, var(--color-surface))`,
          }}
        >
          {count}
        </span>
      </div>

      {count === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[14px] px-6 py-12 text-center">
          <div
            className="flex h-[62px] w-[62px] items-center justify-center rounded-full text-[28px]"
            style={{
              background: `color-mix(in srgb, ${ADMIN_HEX.success} 16%, var(--color-surface))`,
              color: ADMIN_HEX.success,
              border: `1px solid color-mix(in srgb, ${ADMIN_HEX.success} 35%, transparent)`,
            }}
          >
            ✓
          </div>
          <div className="flex flex-col gap-[5px]">
            <div
              className="text-[16px] font-semibold"
              style={{ color: ADMIN_HEX.success }}
            >
              ¡Todo limpio!
            </div>
            <div className="max-w-[300px] text-body leading-[1.5] text-text-muted">
              No hay órdenes pendientes en Nivel 2. La bandeja de escalados está al
              día.
            </div>
          </div>
        </div>
      ) : (
        <ul
          data-testid="bandeja-scroll"
          className="flex max-h-[460px] flex-col overflow-y-auto"
        >
          {items.map((o) => {
            const c = diasColor(o.dias)
            return (
              <li
                key={o.id}
                className="flex items-center gap-[14px] border-b border-border-subtle px-[18px] py-[14px]"
              >
                <span
                  className="w-1 flex-shrink-0 self-stretch rounded-[2px]"
                  style={{ background: c }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <div className="flex items-center gap-[10px]">
                    <span className="text-body font-bold text-text-primary">
                      {o.orden}
                    </span>
                    <span className="text-caption text-text-secondary">
                      {o.abonado}
                    </span>
                  </div>
                  <div className="text-caption text-text-muted">
                    {o.zona} · {o.motivo}
                  </div>
                </div>
                <span
                  className="whitespace-nowrap rounded-pill px-[10px] py-[3px] text-[11px] font-semibold"
                  style={{ color: estadoHex(o.estado), background: estadoTint(o.estado) }}
                >
                  {o.estado}
                </span>
                <span
                  className="min-w-[64px] text-right text-caption font-semibold"
                  style={{ color: c }}
                >
                  {diasLabel(o.dias)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
