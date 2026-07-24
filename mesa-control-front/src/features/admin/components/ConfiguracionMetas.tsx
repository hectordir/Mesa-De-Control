import { useState } from 'react'
import { ADMIN_HEX } from '../lib/admin.presentation'

interface MetaDef {
  id: string
  label: string
  suffix: string
}

const META_DEFS: MetaDef[] = [
  { id: 'efectividad', label: 'Efectividad Mesa (%)', suffix: '%' },
  { id: 'soporte2', label: 'Límite Soporte 2 (%)', suffix: '%' },
  { id: 'noc', label: 'Límite NOC (%)', suffix: '%' },
  { id: 'pendientes', label: 'Límite Pendientes', suffix: 'órd.' },
]

/**
 * Umbrales de evaluación de la mesa. UI-local por decisión del spec (§4): editar
 * y "guardar" solo alternan el modo, no persiste nada en el back.
 */
export function ConfiguracionMetas() {
  const [editing, setEditing] = useState(false)
  const [metas, setMetas] = useState<Record<string, string>>({
    efectividad: '85',
    soporte2: '20',
    noc: '10',
    pendientes: '15',
  })

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-[18px] py-[15px]">
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-brand-chip text-[13px] text-brand"
        >
          ⚙
        </span>
        <h2 className="text-[15px] font-semibold tracking-[-.01em] text-text-primary">
          Configuración de Metas (KPIs)
        </h2>
        <span className="text-caption text-text-muted">
          Umbrales usados para evaluar la mesa
        </span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="ml-auto inline-flex items-center gap-[7px] rounded-[9px] border px-[13px] py-[7px] text-caption font-semibold"
          style={{
            color: editing ? ADMIN_HEX.success : ADMIN_HEX.brand,
            background: `color-mix(in srgb, ${editing ? ADMIN_HEX.success : ADMIN_HEX.brand} 14%, var(--color-surface))`,
            borderColor: `color-mix(in srgb, ${editing ? ADMIN_HEX.success : ADMIN_HEX.brand} 40%, transparent)`,
          }}
        >
          <span>{editing ? '✓' : '✎'}</span>
          {editing ? 'Guardar metas' : 'Editar Metas'}
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 p-[18px]">
        {META_DEFS.map((m) => (
          <div key={m.id} className="flex flex-col gap-[7px]">
            <label
              htmlFor={`meta-${m.id}`}
              className="text-[11px] font-semibold uppercase tracking-[.05em] text-text-secondary"
            >
              {m.label}
            </label>
            <div
              className="flex items-center gap-2 rounded-[10px] border px-3"
              style={{
                background: editing ? 'var(--color-bg)' : 'var(--color-border-subtle)',
                borderColor: editing ? ADMIN_HEX.brand : 'var(--color-border-subtle)',
              }}
            >
              <input
                id={`meta-${m.id}`}
                type="number"
                value={metas[m.id]}
                readOnly={!editing}
                onChange={(e) =>
                  setMetas((s) => ({ ...s, [m.id]: e.target.value }))
                }
                className="min-w-0 flex-1 border-none bg-transparent py-[11px] text-[20px] font-bold tracking-[-.01em] text-text-primary outline-none"
              />
              <span className="text-body font-semibold text-text-muted">
                {m.suffix}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
