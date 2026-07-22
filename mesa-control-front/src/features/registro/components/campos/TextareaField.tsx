import { useId } from 'react'
import { FieldShell } from './FieldShell'
import { controlClass } from './controlClass'

export function TextareaField({
  label,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  placeholder?: string
  rows?: number
}) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error}>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={controlClass(error) + ' resize-y'}
      />
    </FieldShell>
  )
}
