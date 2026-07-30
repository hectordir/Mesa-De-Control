import { useId } from 'react'
import { DatePickerPopover } from '../../../../components/ui/DatePickerPopover'
import { FieldShell } from './FieldShell'
import { controlClass } from './controlClass'

/** Etiqueta legible para el disparador: 'DD/MM/YYYY'. */
function formatLegible(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${date.getFullYear()}`
}

/**
 * Campo de fecha con calendario `react-day-picker` (Rev. 2 del spec).
 * Emite 'YYYY-MM-DD' al formulario, igual que el antiguo `<input type="date">`.
 * El calendario y su popover viven en `DatePickerPopover`; aquí sólo el
 * disparador con aspecto de campo de formulario.
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

  return (
    <FieldShell id={id} label={label} error={error}>
      <DatePickerPopover value={value} onChange={onChange} dialogLabel={label}>
        {({ open, toggle, selected }) => {
          const legible = selected ? formatLegible(selected) : 'Selecciona una fecha'
          return (
            <button
              id={id}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-label={`${label}, ${legible}`}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              onClick={toggle}
              className={controlClass(error) + ' flex items-center justify-between text-left'}
            >
              <span>{legible}</span>
              <span aria-hidden className="text-text-muted">
                📅
              </span>
            </button>
          )
        }}
      </DatePickerPopover>
    </FieldShell>
  )
}
