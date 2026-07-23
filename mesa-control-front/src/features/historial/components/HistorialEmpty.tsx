import { Button } from '../../../components/ui'

interface HistorialEmptyProps {
  onLimpiar: () => void
  onVerMes: () => void
}

/** Estado vacío: sin gestiones para el filtro actual. */
export function HistorialEmpty({ onLimpiar, onVerMes }: HistorialEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-12 text-center">
      <p className="text-body font-semibold text-text-primary">
        No hay gestiones para estos filtros
      </p>
      <p className="max-w-sm text-caption text-text-secondary">
        Ajusta la búsqueda o el rango de fechas, o revisa el mes en curso para
        ver toda la actividad registrada.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="secondary" onClick={onLimpiar}>
          Limpiar búsqueda
        </Button>
        <Button variant="primary" onClick={onVerMes}>
          Ver todo el mes
        </Button>
      </div>
    </div>
  )
}
