import type { DistribucionSeg } from '../analisis-mensual.derive'
import { AveriaBar } from './AveriaBar'
import { Panel } from './PanelStates'

/** Top-5 de motivos del mes como barras de progreso con su porcentaje. */
export function RecurringFailuresPanel({
  segmentos,
}: {
  segmentos: readonly DistribucionSeg[]
}) {
  const top = segmentos.slice(0, 5)

  return (
    <Panel
      titulo="Averías Recurrentes"
      subtitulo="Motivos más frecuentes del mes"
      estado="data"
    >
      <div className="flex flex-col gap-4 p-5">
        {top.map((s) => (
          <AveriaBar
            key={s.label}
            averia={{ motivo: s.label, total: s.pct }}
            maximo={100}
            sufijo="%"
          />
        ))}
      </div>
    </Panel>
  )
}
