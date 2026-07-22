import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import { cx } from './cx'

export type InputSize = 'sm' | 'md'
/** Superficie sobre la que se apoya el campo. */
export type InputTone = 'surface' | 'inset'

export interface InputProps extends ComponentPropsWithRef<'input'> {
  label?: string
  error?: string
  /** Icono decorativo anclado a la izquierda del control. */
  leadingIcon?: ReactNode
  /** Talla del control: `md` por defecto, `sm` para barras de filtro. */
  inputSize?: InputSize
  /** `inset` lo apoya sobre `bg` (campos dentro de una tarjeta). */
  tone?: InputTone
  /** Sustituye las clases por defecto del `<label>`. */
  labelClassName?: string
  /** Sustituye el espaciado por defecto del contenedor vertical. */
  wrapperClassName?: string
}

const paddings: Record<InputSize, { conIcono: string; sinIcono: string }> = {
  md: { conIcono: 'pl-[42px] pr-3 py-2', sinIcono: 'px-3 py-2' },
  sm: { conIcono: 'pl-[30px] pr-[10px] py-[6px]', sinIcono: 'px-[10px] py-[6px]' },
}

const iconOffsets: Record<InputSize, string> = {
  md: 'left-[14px]',
  sm: 'left-[10px]',
}

export function Input({
  label,
  error,
  leadingIcon,
  inputSize = 'md',
  tone = 'surface',
  labelClassName,
  wrapperClassName,
  className,
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const spacing = paddings[inputSize]

  const control = (
    <input
      id={inputId}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
      className={cx(
        'w-full rounded-control border text-text-primary',
        tone === 'inset' ? 'bg-bg' : 'bg-surface',
        inputSize === 'sm' ? 'text-caption' : 'text-body',
        leadingIcon ? spacing.conIcono : spacing.sinIcono,
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
            className={cx(
              'pointer-events-none absolute flex items-center text-text-muted',
              iconOffsets[inputSize],
            )}
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
