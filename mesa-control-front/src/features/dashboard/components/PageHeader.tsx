import type { OperationDay } from '../hooks/useOperationDay'
import { DashboardViewToggle } from './DashboardViewToggle'
import { OperationDatePicker } from './OperationDatePicker'

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
        <DashboardViewToggle />
        <OperationDatePicker dia={dia} />
      </div>
    </div>
  )
}
