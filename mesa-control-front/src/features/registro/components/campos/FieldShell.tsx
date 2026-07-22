import type { ReactNode } from 'react'

/** Envoltorio común: etiqueta + control + mensaje de error, con tokens. */
export function FieldShell({
  id,
  label,
  error,
  children,
  className,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className ?? 'flex flex-col gap-1'}>
      <label htmlFor={id} className="text-label uppercase text-text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
