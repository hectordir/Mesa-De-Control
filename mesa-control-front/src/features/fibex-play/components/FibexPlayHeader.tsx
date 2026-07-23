import { Badge } from '../../../components/ui'
import { cx } from '../../../components/ui/cx'
import { FibexPlayToggle } from './FibexPlayToggle'

interface FibexPlayHeaderProps {
  caidos: number
}

/** Encabezado: título, toggle segmentado y badge de estado global. */
export function FibexPlayHeader({ caidos }: FibexPlayHeaderProps) {
  const hayFallas = caidos > 0
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold leading-tight tracking-[-.02em]">
          Fibex Play
        </h1>
        <p className="text-[13px] text-text-muted">
          Estado de la grilla de canales TV / streaming · monitoreo en vivo
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FibexPlayToggle />

        <Badge tone={hayFallas ? 'danger' : 'success'} aria-live="polite">
          <span
            aria-hidden="true"
            className={cx(
              'h-[6px] w-[6px] rounded-pill',
              hayFallas ? 'bg-danger' : 'bg-success',
            )}
          />
          {hayFallas
            ? `${caidos} ${caidos === 1 ? 'canal caído' : 'canales caídos'}`
            : 'Transmisión estable'}
        </Badge>
      </div>
    </div>
  )
}
