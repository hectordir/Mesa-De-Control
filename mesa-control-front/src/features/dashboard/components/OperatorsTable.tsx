import type { OperadorResumen } from '../../../lib/api/types'
import { cx } from '../../../components/ui/cx'
import { efectividad, efectividadTono, iniciales, totales } from '../derive'

const COLUMNAS = ['Clientes', 'Mesa', 'Sop. 2', 'NOC'] as const

const TONOS = {
  success: 'text-success',
  warning: 'text-warning',
} as const

const PUNTOS = {
  success: 'bg-success',
  warning: 'bg-warning',
} as const

const th =
  'px-3 py-[9px] text-right text-label uppercase tracking-[.05em] text-text-muted border-b border-border'
const td = 'px-3 py-[11px] text-right border-b border-border-subtle'

export function OperatorsTable({
  operadores,
}: {
  operadores: readonly OperadorResumen[]
}) {
  const total = totales(operadores)

  return (
    <table
      aria-label="Resumen por operador"
      className="tabular w-full border-collapse text-[13px]"
    >
      <thead>
        <tr>
          <th
            scope="col"
            className={cx(th, 'px-4 text-left')}
          >
            Operador
          </th>
          {COLUMNAS.map((col, indice) => (
            <th
              key={col}
              scope="col"
              className={cx(th, indice === COLUMNAS.length - 1 && 'px-4')}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {operadores.map((o) => {
          const eff = efectividad(o.mesa, o.clientes)
          const tono = efectividadTono(eff)
          return (
            <tr key={o.id}>
              <td className="border-b border-border-subtle px-4 py-[11px]">
                <div className="flex items-center gap-[9px]">
                  <span
                    aria-hidden="true"
                    className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-pill bg-brand-chip text-label font-bold text-brand"
                  >
                    {iniciales(o.nombre)}
                  </span>
                  <div className="flex min-w-0 flex-col gap-[2px]">
                    <span className="font-semibold text-text-primary">{o.nombre}</span>
                    <span
                      className={cx(
                        'inline-flex items-center gap-[5px] text-label font-semibold',
                        TONOS[tono],
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx('h-[5px] w-[5px] rounded-pill', PUNTOS[tono])}
                      />
                      {eff}% efectividad
                    </span>
                  </div>
                </div>
              </td>
              <td className={cx(td, 'font-semibold text-text-primary')}>{o.clientes}</td>
              <td className={cx(td, 'text-text-secondary')}>{o.mesa}</td>
              <td className={cx(td, 'text-text-secondary')}>{o.soporte2}</td>
              <td className={cx(td, 'px-4 text-text-secondary')}>{o.noc}</td>
            </tr>
          )
        })}
        <tr className="bg-surface-elevated">
          <td className="px-4 py-[11px] text-label font-bold uppercase tracking-[.05em] text-text-secondary">
            Total
          </td>
          <td className="px-3 py-[11px] text-right font-bold">{total.clientes}</td>
          <td className="px-3 py-[11px] text-right font-bold">{total.mesa}</td>
          <td className="px-3 py-[11px] text-right font-bold">{total.soporte2}</td>
          <td className="px-4 py-[11px] text-right font-bold">{total.noc}</td>
        </tr>
      </tbody>
    </table>
  )
}
