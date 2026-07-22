import type { AveriaItem } from '../../../lib/api/types'
import { anchoBarra } from '../derive'

export interface AveriaBarProps {
  averia: AveriaItem
  maximo: number
}

export function AveriaBar({ averia, maximo }: AveriaBarProps) {
  const ancho = anchoBarra(averia.total, maximo)

  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-text-secondary">{averia.motivo}</span>
        <span className="tabular font-bold text-text-primary">{averia.total}</span>
      </div>
      <div
        role="meter"
        aria-label={averia.motivo}
        aria-valuenow={averia.total}
        aria-valuemin={0}
        aria-valuemax={maximo}
        className="h-[9px] overflow-hidden rounded-[5px] bg-bg"
      >
        <div
          className="h-full rounded-[5px] bg-cat-1"
          style={{ width: `${ancho}%` }}
        />
      </div>
    </div>
  )
}
