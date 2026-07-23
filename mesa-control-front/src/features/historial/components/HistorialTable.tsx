import { cx } from '../../../components/ui/cx'
import type {
  GestionRow,
  HistorialSortKey,
  SortDir,
} from '../../../lib/api/types'
import { esZebra, formatFecha } from '../lib/historial.presentation'
import { ResultadoChip } from './ResultadoChip'

interface HistorialTableProps {
  rows: GestionRow[]
  sortKey: HistorialSortKey
  sortDir: SortDir
  onSort: (key: HistorialSortKey) => void
  onOpenRow: (row: GestionRow) => void
}

interface Columna {
  /** Clave ordenable, o `null` si la columna no ordena. */
  key: HistorialSortKey | null
  label: string
}

const COLUMNAS: Columna[] = [
  { key: null, label: 'Código' },
  { key: 'operador', label: 'Operador' },
  { key: 'abonado', label: 'Abonado' },
  { key: null, label: 'Teléfono' },
  { key: 'zona', label: 'Zona' },
  { key: 'resultado', label: 'Resultado' },
  { key: 'fecha', label: 'Fecha' },
  { key: null, label: 'Hora' },
]

function flecha(activa: boolean, dir: SortDir): string {
  if (!activa) return '↕'
  return dir === 'asc' ? '▲' : '▼'
}

/** Tabla densa: header sticky, orden por columna server-side y zebra. */
export function HistorialTable({
  rows,
  sortKey,
  sortDir,
  onSort,
  onOpenRow,
}: HistorialTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface">
      <table className="w-full border-collapse text-left text-caption">
        <thead>
          <tr className="border-b border-border">
            {COLUMNAS.map((col) => {
              const activa = col.key !== null && col.key === sortKey
              return (
                <th
                  key={col.label}
                  scope="col"
                  className="sticky top-0 z-10 bg-surface-elevated px-3 py-[10px] text-label uppercase text-text-muted"
                >
                  {col.key ? (
                    <button
                      type="button"
                      onClick={() => onSort(col.key as HistorialSortKey)}
                      aria-sort={
                        activa
                          ? sortDir === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                      className={cx(
                        'inline-flex items-center gap-1 uppercase',
                        activa ? 'text-text-primary' : 'hover:text-text-secondary',
                      )}
                    >
                      {col.label}
                      <span aria-hidden="true" className="text-[10px]">
                        {flecha(activa, sortDir)}
                      </span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              onClick={() => onOpenRow(row)}
              className={cx(
                'cursor-pointer border-b border-border-subtle transition-colors hover:bg-surface-elevated',
                esZebra(index) && 'bg-bg/40',
              )}
            >
              <td className="px-3 py-[10px] font-medium text-text-secondary">
                {row.codigo}
              </td>
              <td className="px-3 py-[10px]">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill bg-brand-avatar text-[10px] font-semibold text-text-primary"
                  >
                    {row.operador.iniciales}
                  </span>
                  <span className="text-text-primary">{row.operador.nombre}</span>
                </span>
              </td>
              <td className="px-3 py-[10px] text-text-primary">{row.abonado}</td>
              <td className="px-3 py-[10px] tabular-nums text-text-secondary">
                {row.telefono}
              </td>
              <td className="px-3 py-[10px] text-text-secondary">{row.zona}</td>
              <td className="px-3 py-[10px]">
                <ResultadoChip resultado={row.resultado} />
              </td>
              <td className="px-3 py-[10px] tabular-nums text-text-secondary">
                {formatFecha(row.fecha)}
              </td>
              <td className="px-3 py-[10px] tabular-nums text-text-secondary">
                {row.hora}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
