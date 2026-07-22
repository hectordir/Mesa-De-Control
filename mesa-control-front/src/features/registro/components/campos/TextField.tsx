import { useId } from 'react'
import { FieldShell } from './FieldShell'
import { controlClass } from './controlClass'

export function TextField({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  readOnly,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  error?: string
  type?: string
  placeholder?: string
  readOnly?: boolean
}) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error}>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={
          readOnly
            ? controlClass(error) + ' cursor-not-allowed text-text-secondary'
            : controlClass(error)
        }
      />
    </FieldShell>
  )
}
