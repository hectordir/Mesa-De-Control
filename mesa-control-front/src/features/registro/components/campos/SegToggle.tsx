import { useId } from 'react'
import { cx } from '../../../../components/ui/cx'

/**
 * Toggle segmentado No/Sí sobre un checkbox nativo (accesible por etiqueta).
 * El checkbox real queda oculto; el track visible refleja su estado.
 */
export function SegToggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label uppercase text-text-muted">{label}</span>
      <label
        htmlFor={id}
        className="inline-flex w-fit cursor-pointer items-center gap-3 rounded-control border border-border bg-bg px-3 py-2"
      >
        <input
          id={id}
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <span
          aria-hidden="true"
          className={cx(
            'relative h-5 w-9 rounded-pill transition-colors',
            checked ? 'bg-brand' : 'bg-border',
          )}
        >
          <span
            className={cx(
              'absolute top-[2px] h-4 w-4 rounded-pill bg-surface transition-all',
              checked ? 'left-[18px]' : 'left-[2px]',
            )}
          />
        </span>
        <span className="text-body text-text-secondary">
          {checked ? 'Sí' : 'No'}
        </span>
      </label>
    </div>
  )
}
