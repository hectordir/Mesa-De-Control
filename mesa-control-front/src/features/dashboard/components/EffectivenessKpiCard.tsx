import { cx } from '../../../components/ui/cx'
import { fmt, metaStatus, type MetaTono } from '../analisis-mensual.derive'
import { GaugeIcon } from './icons'
import type { EstadoPanel } from './PanelStates'
import { MonthlyKpiCard } from './MonthlyKpiCard'

const TONOS_META: Record<MetaTono, string> = {
  success: 'text-success',
  warning: 'text-warning',
  muted: 'text-text-muted',
}

export interface EffectivenessKpiCardProps {
  efectividad: number
  resueltos: number
  meta: number
  estado: EstadoPanel
}

/** Efectividad global con barra de progreso y marca de la meta de equipo. */
export function EffectivenessKpiCard({
  efectividad,
  resueltos,
  meta,
  estado,
}: EffectivenessKpiCardProps) {
  const vacio = estado === 'empty'
  const cargando = estado === 'loading'
  const conDatos = estado === 'data'
  const status = metaStatus(efectividad, meta, conDatos)
  const relleno = conDatos ? Math.min(100, Math.max(0, efectividad)) : 0

  return (
    <MonthlyKpiCard
      label="Efectividad Global"
      icono={<GaugeIcon />}
      tono="success"
      valor={`${efectividad}%`}
      cargando={cargando}
      vacio={vacio}
      anchoCarga="w-[120px]"
      extra={
        conDatos ? (
          <span className="rounded-pill border border-success-outline bg-success-soft px-[10px] py-[5px] text-caption font-bold text-success">
            {fmt(resueltos)} resueltos
          </span>
        ) : null
      }
    >
      <div className="flex flex-col gap-[6px]">
        <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted">
          <span>Meta de equipo: {meta}%</span>
          <span className={TONOS_META[status.tone]}>{status.label}</span>
        </div>
        <div
          role="meter"
          aria-label="Efectividad global"
          aria-valuenow={relleno}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-[9px] overflow-hidden rounded-[5px] bg-bg"
        >
          <div
            className="h-full rounded-[5px] bg-success"
            style={{ width: `${relleno}%` }}
          />
        </div>
        <div className="relative h-0">
          <span
            aria-hidden="true"
            className={cx(
              'absolute -top-[15px] h-[15px] w-[2px] bg-text-secondary',
            )}
            style={{ left: `${meta}%` }}
          />
        </div>
      </div>
    </MonthlyKpiCard>
  )
}
