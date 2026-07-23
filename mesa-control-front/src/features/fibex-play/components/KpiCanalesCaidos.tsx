import { cx } from '../../../components/ui/cx'

/** KPI · canales caídos; neutral/OK sin caídas, alerta danger con caídas. */
export function KpiCanalesCaidos({ caidos }: { caidos: number }) {
  const hayFallas = caidos > 0
  return (
    <div
      role="group"
      aria-label="Canales Caídos"
      className={cx(
        'flex items-center gap-4 rounded-card border border-l-4 p-5 shadow-elevation',
        hayFallas
          ? 'border-danger border-l-danger bg-danger-soft'
          : 'border-border border-l-neutral bg-surface',
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-pill text-[20px] font-bold',
          hayFallas
            ? 'bg-danger text-brand-fg'
            : 'bg-success-soft text-success',
        )}
      >
        {hayFallas ? '⚠' : '✓'}
      </span>
      <div className="flex flex-col gap-2">
        <span className="text-label uppercase tracking-[.06em] text-text-muted">
          Canales Caídos
        </span>
        <span
          className={cx(
            'tabular text-[46px] font-bold leading-none tracking-[-.02em]',
            hayFallas ? 'text-danger' : 'text-text-primary',
          )}
        >
          {caidos}
        </span>
        <span className="text-caption text-text-muted">
          {hayFallas
            ? 'requieren revisión inmediata'
            : 'ningún canal requiere revisión'}
        </span>
      </div>
    </div>
  )
}
