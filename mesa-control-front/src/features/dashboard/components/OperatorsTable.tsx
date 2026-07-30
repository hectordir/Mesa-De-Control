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

/**
 * `sticky top-0` con fondo opaco del tema: las filas no se ven pasar por debajo
 * de la cabecera al desplazar la lista.
 */
const th =
  'sticky top-0 z-[2] bg-surface px-3 py-[9px] text-label uppercase tracking-[.05em] text-text-muted border-b border-border'
const td = 'px-3 py-[11px] text-right border-b border-border-subtle'

/**
 * El TOTAL es un `tfoot` fijado con `sticky bottom-0` y fondo opaco del tema:
 * queda siempre a la vista y, al vivir en la misma tabla que las filas, comparte
 * `colgroup` y ancho de contenido con ellas — sus cifras caen exactas bajo cada
 * columna, haya barra de scroll o no.
 */
const tf = 'sticky bottom-0 z-[2] bg-surface-elevated px-3 py-[11px]'
const tdTotal = cx(tf, 'text-right font-bold')

/**
 * `border-separate` (y no `border-collapse`) para que los bordes de la cabecera
 * fija se sigan pintando al hacer scroll.
 */
const tabla =
  'tabular h-full w-full table-fixed border-separate border-spacing-0 text-[13px]'

/** Anchos compartidos por la tabla scrollable y la fila TOTAL: columnas alineadas. */
function Columnas() {
  return (
    <colgroup>
      <col />
      <col className="w-[92px]" />
      <col className="w-[78px]" />
      <col className="w-[84px]" />
      <col className="w-[74px]" />
    </colgroup>
  )
}

export function OperatorsTable({
  operadores,
}: {
  operadores: readonly OperadorResumen[]
}) {
  const total = totales(operadores)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/*
        Cabecera y TOTAL viven en la misma tabla, fijados con `sticky` arriba y
        abajo: un solo `colgroup` y un solo ancho de contenido, así que no hay
        barra de scroll que compensar entre dos tablas.

        Los 280px (filas + TOTAL) igualan el cuerpo de "Distribución de
        resultados" (dona de 240px + 40px de padding): la fila 1 cierra pareja
        sin que ninguno de los dos deje hueco muerto. Es alto *fijo* y la tabla
        va `h-full`: con una o dos filas el `tfoot` sigue cayendo al fondo del
        panel en vez de quedarse pegado bajo la última fila, a media altura.
      */}
      <div className="am-scroll h-[280px] overflow-y-auto">
        <table aria-label="Resumen por operador" className={tabla}>
          <Columnas />
          <thead>
            <tr>
              <th scope="col" className={cx(th, 'px-4 text-left')}>
                Operador
              </th>
              {COLUMNAS.map((col, indice) => (
                <th
                  key={col}
                  scope="col"
                  className={cx(
                    th,
                    'text-right',
                    indice === COLUMNAS.length - 1 && 'px-4',
                  )}
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
                // `h-px` es un mínimo para una fila de tabla: la celda sigue
                // midiendo su contenido, pero la fila deja de repartirse el
                // hueco sobrante del alto fijo — se lo lleva todo el relleno.
                <tr key={o.id} className="h-px">
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
            {/*
              Relleno: absorbe el alto que sobra cuando hay pocas filas y empuja
              el TOTAL al fondo. Con la lista llena colapsa a 0. `aria-hidden`
              porque no es una fila de datos: no debe leerse ni contarse.
            */}
            <tr aria-hidden="true" className="h-full">
              <td colSpan={5} />
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td
                className={cx(
                  tf,
                  'px-4 text-label font-bold uppercase tracking-[.05em] text-text-secondary',
                )}
              >
                Total
              </td>
              <td className={tdTotal}>{total.clientes}</td>
              <td className={tdTotal}>{total.mesa}</td>
              <td className={tdTotal}>{total.soporte2}</td>
              <td className={cx(tdTotal, 'px-4')}>{total.noc}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
