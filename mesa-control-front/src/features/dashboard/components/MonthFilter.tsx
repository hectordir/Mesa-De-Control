import { useId } from 'react'
import { cx } from '../../../components/ui/cx'
import type { MonthFilterState } from '../hooks/useMonthFilter'
import { CalendarIcon, ChevronDownIcon } from './icons'

/**
 * Chip con el mes consultado; el `<select>` nativo es el control accesible.
 *
 * El atajo "Volver al mes actual" replica el "Volver a hoy" del Monitor Diario
 * (`OperationDatePicker`) para que ambas vistas se vean y se usen igual.
 */
export function MonthFilter({ mes }: { mes: MonthFilterState }) {
  const id = useId()

  return (
    <div className="flex items-center gap-[10px] rounded-[9px] border border-border bg-surface p-[5px] pl-3 shadow-elevation">
      <label
        htmlFor={id}
        className="text-label uppercase tracking-[.05em] text-text-muted"
      >
        Filtro mensual
      </label>
      <div className="relative flex items-center gap-[7px] rounded-[7px] border border-border bg-bg px-[10px] py-[6px] text-[13px] font-semibold text-text-primary">
        <span aria-hidden="true" className="text-text-muted">
          <CalendarIcon size={14} />
        </span>
        {mes.etiqueta}
        <span aria-hidden="true" className="text-text-muted">
          <ChevronDownIcon size={11} />
        </span>
        <select
          id={id}
          value={mes.periodo}
          onChange={(event) => mes.setPeriodo(event.target.value)}
          // El popup nativo lo pinta el navegador (el `opacity-0` no le
          // afecta): sin color y fondo explícitos hereda el texto claro del
          // chip y queda ilegible. `color-scheme` en la raíz hace el resto.
          className="absolute inset-0 h-full w-full cursor-pointer bg-surface text-text-primary opacity-0"
        >
          {mes.opciones.map((opcion) => (
            <option
              key={opcion.value}
              value={opcion.value}
              className="bg-surface text-text-primary"
            >
              {opcion.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={mes.volverAlMesActual}
        disabled={mes.esMesActual}
        className={cx(
          'whitespace-nowrap rounded-[7px] px-3 py-2 text-caption font-semibold text-text-secondary transition-colors hover:bg-bg hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          mes.esMesActual && 'opacity-60',
        )}
      >
        Volver al mes actual
      </button>
    </div>
  )
}
