import { cx } from '../../../components/ui/cx'
import { Skeleton } from './PanelStates'

export type KpiTono = 'brand' | 'success' | 'warning' | 'danger' | 'info'

const BORDES: Record<KpiTono, string> = {
  brand: 'border-l-brand',
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
  info: 'border-l-info',
}

const PUNTOS: Record<KpiTono, string> = {
  brand: 'bg-brand',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}

export interface KpiCardProps {
  label: string
  valor: string
  meta: string
  tono: KpiTono
  cargando: boolean
  /** Sin gestiones: la cifra pierde énfasis. */
  vacio: boolean
}

export function KpiCard({
  label,
  valor,
  meta,
  tono,
  cargando,
  vacio,
}: KpiCardProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        'flex min-h-[118px] flex-col gap-[10px] rounded-card border border-border border-l-[3px] bg-surface p-4 pl-[18px] shadow-elevation',
        BORDES[tono],
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-label uppercase tracking-[.05em] text-text-muted">
          {label}
        </span>
        <span
          aria-hidden="true"
          className={cx('h-[7px] w-[7px] rounded-pill', PUNTOS[tono])}
        />
      </div>
      {cargando ? (
        <Skeleton className="h-8 w-[70%] rounded-[7px]" />
      ) : (
        <p
          className={cx(
            'tabular text-[32px] font-bold leading-none tracking-[-.02em]',
            vacio ? 'text-text-muted' : 'text-text-primary',
          )}
        >
          {valor}
        </p>
      )}
      <p className="text-caption text-text-muted">{meta}</p>
    </div>
  )
}
