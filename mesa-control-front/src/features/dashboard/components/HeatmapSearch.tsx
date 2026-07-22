import { Input } from '../../../components/ui'
import { SearchIcon } from './icons'

export interface HeatmapSearchProps {
  value: string
  onChange: (valor: string) => void
}

/** Filtro en cliente sobre las zonas ya cargadas del mapa de calor. */
export function HeatmapSearch({ value, onChange }: HeatmapSearchProps) {
  return (
    <Input
      label="Buscar zona"
      labelClassName="sr-only"
      wrapperClassName="min-w-[180px]"
      inputSize="sm"
      tone="inset"
      type="search"
      placeholder="Buscar zona…"
      leadingIcon={<SearchIcon size={13} />}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
