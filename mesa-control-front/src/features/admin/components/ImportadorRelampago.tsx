import { useState } from 'react'
import { ADMIN_HEX } from '../lib/admin.presentation'

/**
 * Importador Relámpago. UI-local (spec §4): no procesa nada, solo cuenta las
 * filas pegadas para dar feedback.
 */
export function ImportadorRelampago() {
  const [texto, setTexto] = useState('')
  const filas = texto.trim() ? texto.trim().split(/\n/).length : 0
  const hint = filas ? `${filas} fila(s) detectada(s)` : 'Aún no has pegado datos.'

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
      <div className="flex items-center gap-[13px] px-[18px] py-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[11px] text-[20px]"
          style={{
            background: `color-mix(in srgb, ${ADMIN_HEX.warning} 16%, var(--color-surface))`,
            color: ADMIN_HEX.warning,
          }}
        >
          ⚡
        </span>
        <div className="flex flex-col gap-[2px]">
          <h2 className="text-[15px] font-bold tracking-[-.01em] text-text-primary">
            Importador Relámpago
          </h2>
          <div className="text-[11px] font-semibold uppercase tracking-[.06em] text-text-muted">
            Carga masiva desde Google Sheets
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-[18px] pb-[18px]">
        <label htmlFor="importador" className="text-body text-text-secondary">
          Selecciona tus filas en Google Sheets (incluyendo títulos), copia y pega
          aquí:
        </label>
        <textarea
          id="importador"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pega aquí los datos del Excel…"
          className="min-h-[150px] w-full resize-y rounded-[11px] border border-border bg-bg px-4 py-[14px] text-body leading-[1.6] text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-cta bg-brand px-[18px] py-[10px] text-body font-semibold text-brand-fg hover:opacity-90"
          >
            <span>⚡</span>Procesar carga
          </button>
          <span className="text-caption text-text-muted">{hint}</span>
        </div>
      </div>
    </section>
  )
}
