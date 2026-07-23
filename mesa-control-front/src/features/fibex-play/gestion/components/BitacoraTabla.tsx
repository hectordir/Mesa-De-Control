import { cx } from '../../../../components/ui/cx'
import type { RegistroAtencion } from '../../../../lib/api/types'
import {
  ESTADO_DOT,
  ESTADO_LABEL,
  ESTADO_TEXT,
  iniciales,
} from '../lib/gestion.presentation'

const TH =
  'px-4 py-3 text-left text-label uppercase tracking-[.05em] text-text-muted'
const TD = 'px-4 py-3 text-[13px] text-text-secondary'

/** Tabla desktop de la bitácora, con scroll horizontal en pantallas estrechas. */
export function BitacoraTabla({ registros }: { registros: RegistroAtencion[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className={TH}>Operador</th>
            <th className={TH}>Abonado</th>
            <th className={TH}>Canal</th>
            <th className={TH}>Motivo</th>
            <th className={TH}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((r) => (
            <tr key={r.id} className="border-b border-border-subtle">
              <td className={TD}>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-pill bg-brand-avatar text-[11px] font-semibold text-brand">
                    {iniciales(r.operador)}
                  </span>
                  <span className="font-medium text-text-primary">
                    {r.operador}
                  </span>
                </div>
              </td>
              <td className={TD}>{r.abonado}</td>
              <td className={TD}>{r.canal}</td>
              <td className={TD}>{r.motivo}</td>
              <td className={TD}>
                <span
                  className={cx(
                    'inline-flex items-center gap-[6px] rounded-pill border border-border bg-bg px-[10px] py-[3px] text-caption font-medium',
                    ESTADO_TEXT[r.estado],
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      'h-[6px] w-[6px] rounded-pill',
                      ESTADO_DOT[r.estado],
                    )}
                  />
                  {ESTADO_LABEL[r.estado]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
