import type { ReactNode } from 'react'
import { cx } from '../../../../components/ui/cx'

export interface GestionKpiCardProps {
  label: string
  valor: number
  subtitulo: string
  icono: ReactNode
  /** Color de acento: borde izquierdo (+ número/ícono en success/danger). */
  acento: 'brand' | 'success' | 'danger'
}

const BORDE = {
  brand: 'border-l-brand',
  success: 'border-l-success',
  danger: 'border-l-danger',
} as const

const NUMERO = {
  brand: 'text-text-primary',
  success: 'text-success',
  danger: 'text-danger',
} as const

const ICONO = {
  brand: 'text-brand',
  success: 'text-success',
  danger: 'text-danger',
} as const

/** Tarjeta KPI de la bitácora: label, número grande, subtítulo e ícono. */
export function GestionKpiCard({
  label,
  valor,
  subtitulo,
  icono,
  acento,
}: GestionKpiCardProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx(
        'flex flex-col gap-2 rounded-card border border-border border-l-4 bg-surface p-5 shadow-elevation',
        BORDE[acento],
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-label uppercase tracking-[.06em] text-text-muted">
          {label}
        </span>
        <span aria-hidden="true" className={cx('text-[16px]', ICONO[acento])}>
          {icono}
        </span>
      </div>
      <span
        className={cx(
          'tabular text-[46px] font-bold leading-none tracking-[-.02em]',
          NUMERO[acento],
        )}
      >
        {valor}
      </span>
      <span className="text-caption text-text-muted">{subtitulo}</span>
    </div>
  )
}
