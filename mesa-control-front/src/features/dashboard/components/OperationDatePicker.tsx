import { cx } from '../../../components/ui/cx'
import { DatePickerPopover } from '../../../components/ui/DatePickerPopover'
import { parseISO } from '../../../components/ui/isoDate'
import { hoyISO, type OperationDay } from '../hooks/useOperationDay'
import { CalendarIcon, ChevronDownIcon } from './icons'

/**
 * Chip con la fecha de operación y atajo "Volver a hoy".
 *
 * El chip entero es el disparador del mismo calendario que usa Historial
 * (`DatePickerPopover`): una sola ruta de apertura, teclado incluido, y el
 * calendario del tema en vez del desplegable nativo del navegador.
 */
export function OperationDatePicker({ dia }: { dia: OperationDay }) {
  // No hay datos futuros: el día de hoy es el máximo consultable.
  const hoy = parseISO(hoyISO()) ?? new Date()

  return (
    <div className="flex items-center gap-[10px] rounded-[9px] border border-border bg-surface p-[5px] pl-3 shadow-elevation">
      <span className="text-label uppercase tracking-[.05em] text-text-muted">
        Fecha de operación
      </span>
      <DatePickerPopover
        value={dia.fecha}
        onChange={dia.setFecha}
        dialogLabel="Fecha de operación"
        // El chip vive pegado al borde derecho de la barra: anclar el popover
        // por la izquierda lo sacaría de pantalla.
        align="right"
        disabled={{ after: hoy }}
      >
        {({ open, toggle }) => (
          <button
            type="button"
            data-testid="chip-fecha"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-label={`Fecha de operación, ${dia.corto}`}
            onClick={toggle}
            className="relative flex cursor-pointer items-center gap-[7px] rounded-[7px] border border-border bg-bg px-[10px] py-[6px] text-[13px] font-semibold text-text-primary"
          >
            <span aria-hidden="true" className="text-text-muted">
              <CalendarIcon size={14} />
            </span>
            {dia.corto}
            <span aria-hidden="true" className="text-text-muted">
              <ChevronDownIcon size={11} />
            </span>
          </button>
        )}
      </DatePickerPopover>
      <button
        type="button"
        onClick={dia.volverAHoy}
        disabled={dia.esHoy}
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
