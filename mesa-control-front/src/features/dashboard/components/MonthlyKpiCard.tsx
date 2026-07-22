import type { ReactNode } from 'react'
import { cx } from '../../../components/ui/cx'
import { Skeleton } from './PanelStates'

export type MonthlyKpiTono = 'brand' | 'success' | 'danger'

const BORDES: Record<MonthlyKpiTono, string> = {
  brand: 'border-l-brand',
  success: 'border-l-success',
  danger: 'border-l-danger',
}

const ICONOS: Record<MonthlyKpiTono, string> = {
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
}

export interface MonthlyKpiCardProps {
  label: string
  icono: ReactNode
  tono: MonthlyKpiTono
  valor: string
  /** Texto bajo la cifra; se omite cuando la tarjeta trae `children`. */
  meta?: string
  cargando: boolean
  /** Sin gestiones en el mes: la cifra pierde énfasis. */
  vacio: boolean
  /** Ancho del esqueleto de carga (utilidad de Tailwind). */
  anchoCarga?: string
  /** Contenido a la derecha de la cifra (p. ej. el badge de resueltos). */
  extra?: ReactNode
  /** Bloque inferior propio de la tarjeta (p. ej. la barra de meta). */
  children?: ReactNode
}

/** Tarjeta KPI grande del análisis mensual: cifra de 52 px y borde de acento. */
export function MonthlyKpiCard({
  label,
  icono,
  tono,
  valor,
  meta,
  cargando,
  vacio,
  anchoCarga = 'w-[60%]',
  extra,
  children,
}: MonthlyKpiCardProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        'flex min-h-[158px] flex-col gap-[14px] rounded-[14px] border border-border border-l-[3px] bg-surface p-[22px] shadow-elevation',
        BORDES[tono],
      )}
    >
      <div className="flex items-center gap-[11px]">
        <span
          aria-hidden="true"
          className={cx(
            'flex h-[34px] w-[34px] items-center justify-center rounded-[9px]',
            ICONOS[tono],
          )}
        >
          {icono}
        </span>
        <span className="text-label uppercase tracking-[.05em] text-text-muted">
          {label}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {cargando ? (
          <Skeleton className={cx('h-12 rounded-control', anchoCarga)} />
        ) : (
          <p
            className={cx(
              'tabular text-[52px] font-bold leading-none tracking-[-.03em]',
              vacio ? 'text-text-muted' : 'text-text-primary',
            )}
          >
            {valor}
          </p>
        )}
        {cargando ? null : extra}
      </div>

      {children ?? <p className="text-caption text-text-muted">{meta}</p>}
    </div>
  )
}
