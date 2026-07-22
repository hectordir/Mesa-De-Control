import { cx } from '../../../components/ui/cx'
import type { OperationDay } from '../hooks/useOperationDay'
import { CalendarIcon, ChevronDownIcon } from './icons'

/**
 * Chip con la fecha de operación y atajo "Volver a hoy".
 * El calendario desplegable queda fuera del alcance de este ticket.
 */
export function OperationDatePicker({ dia }: { dia: OperationDay }) {
  return (
    <div className="flex items-center gap-[10px] rounded-[9px] border border-border bg-surface p-[5px] pl-3 shadow-elevation">
      <span className="text-label uppercase tracking-[.05em] text-text-muted">
        Fecha de operación
      </span>
      <div
        data-testid="chip-fecha"
        className="flex items-center gap-[7px] rounded-[7px] border border-border bg-bg px-[10px] py-[6px] text-[13px] font-semibold text-text-primary"
      >
        <span className="text-text-muted">
          <CalendarIcon size={14} />
        </span>
        {dia.corto}
        <span className="text-text-muted">
          <ChevronDownIcon size={11} />
        </span>
      </div>
      <button
        type="button"
        onClick={dia.volverAHoy}
        className={cx(
          'rounded-[7px] px-3 py-2 text-caption font-semibold text-text-secondary transition-colors hover:bg-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          dia.esHoy && 'opacity-60',
        )}
      >
        Volver a hoy
      </button>
    </div>
  )
}
