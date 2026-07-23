import { cx } from '../../../components/ui/cx'
import {
  resultadoPresentation,
  type ResultadoTone,
} from '../lib/resultado.presentation'

const dotClass: Record<ResultadoTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-neutral',
}

const chipClass: Record<ResultadoTone, string> = {
  success: 'text-success border-success',
  warning: 'text-warning border-warning',
  danger: 'text-danger border-danger',
  info: 'text-info border-info',
  neutral: 'text-neutral border-neutral',
}

/** Chip semántico de estado con punto de color; único traductor visual del enum. */
export function ResultadoChip({
  resultado,
  className,
}: {
  resultado: string
  className?: string
}) {
  const { label, tone } = resultadoPresentation(resultado)
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[6px] whitespace-nowrap rounded-chip border px-2 py-[3px] text-caption font-medium',
        chipClass[tone],
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx('h-[6px] w-[6px] flex-shrink-0 rounded-pill', dotClass[tone])}
      />
      {label}
    </span>
  )
}
