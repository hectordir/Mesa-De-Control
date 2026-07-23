import { cx } from '../../../components/ui/cx'
import type { HistorialResponse, ResultadoGestion } from '../../../lib/api/types'
import {
  resultadoPresentation,
  RESULTADOS_ORDEN,
  type ResultadoTone,
} from '../lib/resultado.presentation'

interface ResultadoFiltersProps {
  counts: HistorialResponse['counts']
  activo: ResultadoGestion | null
  onChange: (resultado: ResultadoGestion | null) => void
}

const activoClass: Record<ResultadoTone, string> = {
  success: 'border-success text-success bg-success-soft',
  warning: 'border-warning text-warning bg-warning-soft',
  danger: 'border-danger text-danger bg-danger-soft',
  info: 'border-info text-info bg-info-soft',
  neutral: 'border-neutral text-neutral bg-neutral-soft',
}

const dotClass: Record<ResultadoTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-neutral',
}

const base =
  'inline-flex items-center gap-[6px] whitespace-nowrap rounded-pill border px-3 py-[6px] text-caption font-medium transition-colors'

/** Chips por resultado con contador; "Todos" resetea el filtro. */
export function ResultadoFilters({
  counts,
  activo,
  onChange,
}: ResultadoFiltersProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar por resultado"
      className="flex flex-wrap gap-2 overflow-x-auto"
    >
      <button
        type="button"
        aria-pressed={activo === null}
        onClick={() => onChange(null)}
        className={cx(
          base,
          activo === null
            ? 'border-brand-outline bg-brand-soft text-brand'
            : 'border-border text-text-secondary hover:text-text-primary',
        )}
      >
        Todos
        <span className="tabular-nums text-text-muted">{counts.total}</span>
      </button>

      {RESULTADOS_ORDEN.map((resultado) => {
        const { label, tone } = resultadoPresentation(resultado)
        const activa = activo === resultado
        const total = counts.porResultado[resultado] ?? 0
        return (
          <button
            key={resultado}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(resultado)}
            className={cx(
              base,
              activa
                ? activoClass[tone]
                : 'border-border text-text-secondary hover:text-text-primary',
            )}
          >
            <span
              aria-hidden="true"
              className={cx('h-[6px] w-[6px] rounded-pill', dotClass[tone])}
            />
            {label}
            <span className="tabular-nums text-text-muted">{total}</span>
          </button>
        )
      })}
    </div>
  )
}
