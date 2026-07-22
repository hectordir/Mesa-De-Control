import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from './cx'

export interface InputProps extends ComponentPropsWithRef<'input'> {
  label?: string
  error?: string
  /** Icono decorativo anclado a la izquierda del control. */
  leadingIcon?: ReactNode
  /** Sustituye las clases por defecto del `<label>`. */
  labelClassName?: string
  /** Sustituye el espaciado por defecto del contenedor vertical. */
  wrapperClassName?: string
}

export function Input({
  label,
  error,
  leadingIcon,
  labelClassName,
  wrapperClassName,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`

  const control = (
    <input
      id={inputId}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cx(
        'w-full rounded-control border bg-surface py-2 text-body text-text-primary',
        leadingIcon ? 'pl-[42px] pr-3' : 'px-3',
        'placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-offset-0',
        error
          ? 'border-danger focus:ring-danger'
          : 'border-border focus:border-brand focus:ring-brand',
        className,
      )}
      {...props}
    />
  )

  return (
    <div className={cx('flex flex-col', wrapperClassName ?? 'gap-1')}>
      {label ? (
        <label
          htmlFor={inputId}
          className={cx(
            'text-label uppercase',
            labelClassName ?? 'text-text-muted',
          )}
        >
          {label}
        </label>
      ) : null}
      {leadingIcon ? (
        <div className="relative flex items-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-[14px] flex items-center text-text-muted"
          >
            {leadingIcon}
          </span>
          {control}
        </div>
      ) : (
        control
      )}
      {error ? (
        <p id={errorId} role="alert" className="text-caption text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
