import { Button, Input } from '../../../components/ui'
import { DateField } from '../../registro/components/campos/DateField'

interface HistorialToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  desde: string
  hasta: string
  onDesdeChange: (value: string) => void
  onHastaChange: (value: string) => void
  onExport: () => void
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/** Cabecera de la sección: título, búsqueda, rango de fechas y exportación. */
export function HistorialToolbar({
  search,
  onSearchChange,
  desde,
  hasta,
  onDesdeChange,
  onHastaChange,
  onExport,
}: HistorialToolbarProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-bold leading-tight tracking-[-.02em]">
            Historial General
          </h1>
          <p className="text-[13px] text-text-muted">
            Sábana completa de gestiones registradas
          </p>
        </div>
        <Button variant="secondary" onClick={onExport}>
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          type="search"
          aria-label="Buscar gestiones"
          placeholder="Buscar por abonado, operador o teléfono"
          inputSize="sm"
          leadingIcon={<SearchIcon />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          wrapperClassName="min-w-[240px] flex-1"
        />
        <div className="min-w-[150px]">
          <DateField label="Desde" value={desde} onChange={onDesdeChange} />
        </div>
        <div className="min-w-[150px]">
          <DateField label="Hasta" value={hasta} onChange={onHastaChange} />
        </div>
      </div>
    </div>
  )
}
