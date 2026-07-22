import { useId } from 'react'
import type { MonthFilterState } from '../hooks/useMonthFilter'
import { CalendarIcon, ChevronDownIcon } from './icons'

/** Chip con el mes consultado; el `<select>` nativo es el control accesible. */
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
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {mes.opciones.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
