import type { ActividadItem } from '../../../lib/api/types'
import { horaCorta, iniciales } from '../derive'
import { resultadoMeta } from '../resultado'

export function RadarItem({ actividad }: { actividad: ActividadItem }) {
  const meta = resultadoMeta[actividad.resultado]

  return (
    <li className="flex gap-3 border-b border-border-subtle py-[11px]">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-pill text-label font-bold"
        style={{ background: meta.tonoSuave, color: meta.tono }}
      >
        {iniciales(actividad.operador)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="text-[13px]">
          <span className="font-semibold text-text-primary">
            {actividad.operador}
          </span>{' '}
          <span className="text-text-secondary">{meta.accion}</span>
        </p>
        <p className="text-label font-normal normal-case tracking-normal text-text-muted">
          {actividad.ubicacion}
        </p>
      </div>
      <span className="tabular flex-shrink-0 text-caption text-text-muted">
        {horaCorta(actividad.hora)}
      </span>
    </li>
  )
}
