import { cx } from '../../../components/ui/cx'
import type { OperationDay } from '../hooks/useOperationDay'
import { OperationDatePicker } from './OperationDatePicker'

const VISTAS = ['Monitor Diario', 'Análisis Mensual'] as const

function VistaSegmentada() {
  return (
    <div
      role="tablist"
      aria-label="Vista del dashboard"
      className="flex gap-[2px] rounded-[9px] border border-border bg-bg p-[3px]"
    >
      {VISTAS.map((vista, index) => {
        const activa = index === 0
        return (
          <button
            key={vista}
            role="tab"
            type="button"
            aria-selected={activa}
            tabIndex={activa ? 0 : -1}
            className={cx(
              'inline-flex items-center gap-[6px] rounded-chip px-[13px] py-[7px] text-[13px]',
              activa
                ? 'border border-border bg-surface font-semibold text-text-primary shadow-elevation'
                : 'border border-transparent font-medium text-text-secondary',
            )}
          >
            {activa ? (
              <span
                aria-hidden="true"
                className="h-[6px] w-[6px] rounded-pill bg-success"
              />
            ) : null}
            {vista}
          </button>
        )
      })}
    </div>
  )
}

/** Título de la vista, selector de vista y fecha de operación. */
export function PageHeader({ dia }: { dia: OperationDay }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold leading-tight tracking-[-.02em]">
          Monitor Diario
        </h1>
        <p className="text-[13px] text-text-muted">
          Vista operativa de la mesa de control · {dia.largo}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <VistaSegmentada />
        <OperationDatePicker dia={dia} />
      </div>
    </div>
  )
}
