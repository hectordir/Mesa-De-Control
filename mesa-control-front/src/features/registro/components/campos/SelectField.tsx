import { useId } from 'react'
import type { Opcion } from '../../opciones'
import { FieldShell } from './FieldShell'
import { controlClass } from './controlClass'

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly Opcion[]
  error?: string
  /** Opción vacía inicial (para campos obligatorios sin valor por defecto). */
  placeholder?: string
}) {
  const id = useId()
  return (
    <FieldShell id={id} label={label} error={error}>
      <select
        id={id}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={controlClass(error)}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}
