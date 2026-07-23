import type { GestionRow } from '../../../lib/api/types'
import { formatFecha } from '../lib/historial.presentation'
import { ResultadoChip } from './ResultadoChip'

interface HistorialCardsProps {
  rows: GestionRow[]
  onOpenRow: (row: GestionRow) => void
}

/** Vista móvil: cada gestión como una tarjeta apilada (comparte hook/presentation). */
export function HistorialCards({ rows, onOpenRow }: HistorialCardsProps) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            onClick={() => onOpenRow(row)}
            className="flex w-full flex-col gap-2 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-elevated"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption font-medium text-text-secondary">
                {row.codigo}
              </span>
              <ResultadoChip resultado={row.resultado} />
            </div>
            <span className="text-body font-semibold text-text-primary">
              {row.abonado}
            </span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-pill bg-brand-avatar text-[9px] font-semibold text-text-primary"
                >
                  {row.operador.iniciales}
                </span>
                {row.operador.nombre}
              </span>
              <span>{row.zona}</span>
              <span className="tabular-nums">
                {formatFecha(row.fecha)} · {row.hora}
              </span>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
