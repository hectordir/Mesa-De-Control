import { useEffect, useId, useRef, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import './dateField.css'
import { FieldShell } from './FieldShell'
import { controlClass } from './controlClass'

/** 'YYYY-MM-DD' → Date local (evita el corrimiento de zona horaria de UTC). */
function parseISO(value: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return undefined
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** Date → 'YYYY-MM-DD' (componentes locales, mismo contrato que el `<input>`). */
function toISO(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

/** Etiqueta legible para el disparador: 'DD/MM/YYYY'. */
function formatLegible(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()}`
}

/**
 * Campo de fecha con calendario `react-day-picker` (Rev. 2 del spec).
 * Emite 'YYYY-MM-DD' al formulario, igual que el antiguo `<input type="date">`.
 * Estilizado con los tokens del tema (ver `dateField.css`), accesible por teclado.
 */
export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = parseISO(value)

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const legible = selected ? formatLegible(selected) : 'Selecciona una fecha'

  return (
    <FieldShell id={id} label={label} error={error}>
      <div ref={rootRef} className="relative">
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={`${label}, ${legible}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onClick={() => setOpen((v) => !v)}
          className={controlClass(error) + ' flex items-center justify-between text-left'}
        >
          <span>{legible}</span>
          <span aria-hidden className="text-text-muted">
            📅
          </span>
        </button>
        {open ? (
          <div
            role="dialog"
            aria-label={label}
            className="absolute left-0 z-20 mt-1 rounded-card border border-border bg-surface-elevated p-2 shadow-elevation"
          >
            <DayPicker
              mode="single"
              selected={selected}
              defaultMonth={selected}
              onSelect={(date) => {
                if (date) {
                  onChange(toISO(date))
                  setOpen(false)
                }
              }}
            />
          </div>
        ) : null}
      </div>
    </FieldShell>
  )
}
