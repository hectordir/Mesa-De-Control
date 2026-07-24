import { useState } from 'react'
import type { SupervisionDepuracionItem } from '../../../lib/api/types'
import { ADMIN_HEX } from '../lib/admin.presentation'

/**
 * Depuración de gestiones: selección múltiple + borrado real. La selección vive
 * en local (por id); "Eliminar" delega en `onEliminar` con los ids marcados (la
 * page dispara la mutation `DELETE /supervision/gestiones` e invalida la query).
 */
export function DepuracionGestiones({
  items,
  onEliminar,
  isDeleting = false,
}: {
  items: SupervisionDepuracionItem[]
  onEliminar: (ids: string[]) => void
  isDeleting?: boolean
}) {
  const [sel, setSel] = useState<Set<string>>(new Set())

  const seleccionadas = items.filter((i) => sel.has(i.id))
  const count = seleccionadas.length
  const todas = items.length > 0 && count === items.length

  const toggle = (id: string) =>
    setSel((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleTodas = () =>
    setSel(todas ? new Set() : new Set(items.map((i) => i.id)))

  const eliminar = () => {
    if (count === 0) return
    onEliminar(seleccionadas.map((i) => i.id))
    setSel(new Set())
  }

  return (
    <section
      className="overflow-hidden rounded-card bg-surface shadow-elevation"
      style={{ border: `1px solid color-mix(in srgb, ${ADMIN_HEX.danger} 40%, var(--color-border))` }}
    >
      <div
        className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-[18px] py-[15px]"
        style={{ background: `color-mix(in srgb, ${ADMIN_HEX.danger} 7%, transparent)` }}
      >
        <span
          aria-hidden="true"
          className="flex h-6 w-6 items-center justify-center rounded-[7px] text-[13px]"
          style={{
            background: `color-mix(in srgb, ${ADMIN_HEX.danger} 16%, var(--color-surface))`,
            color: ADMIN_HEX.danger,
          }}
        >
          ⚠
        </span>
        <div className="flex flex-col gap-[1px]">
          <h2
            className="text-[15px] font-semibold tracking-[-.01em]"
            style={{ color: ADMIN_HEX.danger }}
          >
            Depuración de Gestiones
          </h2>
          <div className="text-caption text-text-muted">
            Elimina registros cargados por error · acción irreversible
          </div>
        </div>
        <button
          type="button"
          onClick={eliminar}
          disabled={count === 0 || isDeleting}
          className="ml-auto inline-flex items-center gap-2 rounded-[9px] border px-[15px] py-[9px] text-caption font-semibold disabled:cursor-not-allowed"
          style={{
            color: count ? 'rgb(255,255,255)' : 'var(--color-text-muted)',
            background: count ? ADMIN_HEX.danger : 'var(--color-bg)',
            borderColor: count ? ADMIN_HEX.danger : 'var(--color-border)',
          }}
        >
          <span>🗑</span>
          {count
            ? `Eliminar ${count} seleccionada${count > 1 ? 's' : ''}`
            : 'Eliminar seleccionadas'}
        </button>
      </div>

      <div className="grid grid-cols-[44px_130px_1fr_1fr] items-center border-b border-border-subtle px-[18px] py-[10px]">
        <input
          type="checkbox"
          aria-label="Seleccionar todo"
          checked={todas}
          onChange={toggleTodas}
          className="h-[18px] w-[18px] accent-danger"
        />
        <span className="text-[10px] font-semibold uppercase tracking-[.07em] text-text-muted">
          Fecha
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[.07em] text-text-muted">
          Operador
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[.07em] text-text-muted">
          Abonado
        </span>
      </div>

      <ul
        data-testid="depuracion-scroll"
        className="flex max-h-[460px] flex-col overflow-y-auto"
      >
        {items.map((d) => {
          const marcada = sel.has(d.id)
          return (
            <li
              key={d.id}
              className="grid grid-cols-[44px_130px_1fr_1fr] items-center border-b border-border-subtle px-[18px] py-3"
              style={{
                background: marcada
                  ? `color-mix(in srgb, ${ADMIN_HEX.danger} 9%, transparent)`
                  : 'transparent',
              }}
            >
              <input
                type="checkbox"
                aria-label={`Seleccionar ${d.abonado}`}
                checked={marcada}
                onChange={() => toggle(d.id)}
                className="h-[18px] w-[18px] accent-danger"
              />
              <span className="text-body font-semibold text-text-secondary">
                {d.fecha}
              </span>
              <span className="text-body font-semibold text-text-primary">
                {d.operador}
              </span>
              <span className="truncate text-body text-text-secondary">
                {d.abonado}
              </span>
            </li>
          )
        })}
        {items.length === 0 ? (
          <li className="px-[18px] py-9 text-center text-body text-text-muted">
            No hay gestiones recientes para depurar
          </li>
        ) : null}
      </ul>
    </section>
  )
}
