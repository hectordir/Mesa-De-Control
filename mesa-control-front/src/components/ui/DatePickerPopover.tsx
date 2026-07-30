import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DayPicker, type Matcher } from 'react-day-picker'
import 'react-day-picker/style.css'
import './datePickerPopover.css'
import { etiquetasEs, formatosEs } from './calendarioEs'
import { parseISO, toISO } from './isoDate'

export interface DatePickerTriggerState {
  /** `true` mientras el calendario está desplegado. */
  open: boolean
  /** Abre/cierra el calendario; engánchalo al `onClick` del disparador. */
  toggle: () => void
  /** Fecha seleccionada ya parseada, para rotular el disparador. */
  selected: Date | undefined
}

/**
 * Calendario `react-day-picker` en un popover, sin opinión sobre el disparador:
 * cada consumidor aporta el suyo vía `children` (render prop) y conserva su
 * propio aspecto (campo de formulario en Registro/Historial, chip en Dashboard).
 *
 * Aporta el estado de apertura, el cierre por clic fuera / Escape y la
 * conversión desde/hacia 'YYYY-MM-DD'. El tema vive en `datePickerPopover.css`.
 */
export function DatePickerPopover({
  value,
  onChange,
  dialogLabel,
  align = 'left',
  disabled,
  children,
}: {
  value: string
  onChange: (value: string) => void
  /** Nombre accesible del popover. */
  dialogLabel: string
  /** Lado por el que se ancla el popover (usa `right` si el disparador está pegado al borde). */
  align?: 'left' | 'right'
  /** Días no elegibles, p. ej. `{ after: hoy }`. */
  disabled?: Matcher | Matcher[]
  children: (state: DatePickerTriggerState) => ReactNode
}) {
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

  return (
    <div ref={rootRef} className="relative">
      {children({ open, toggle: () => setOpen((v) => !v), selected })}
      {open ? (
        <div
          role="dialog"
          aria-label={dialogLabel}
          className={
            (align === 'right' ? 'right-0' : 'left-0') +
            ' absolute z-20 mt-1 rounded-card border border-border bg-surface-elevated p-2 shadow-elevation'
          }
        >
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={disabled}
            formatters={formatosEs}
            labels={etiquetasEs}
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
  )
}
