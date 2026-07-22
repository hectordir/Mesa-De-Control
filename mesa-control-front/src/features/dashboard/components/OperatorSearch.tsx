import { Input } from '../../../components/ui'
import { SearchIcon } from './icons'

export interface OperatorSearchProps {
  value: string
  onChange: (valor: string) => void
}

/** Filtro en cliente sobre los operadores ya cargados. */
export function OperatorSearch({ value, onChange }: OperatorSearchProps) {
  return (
    <Input
      label="Buscar operador"
      labelClassName="sr-only"
      wrapperClassName="min-w-[170px]"
      inputSize="sm"
      tone="inset"
      type="search"
      placeholder="Buscar operador…"
      leadingIcon={<SearchIcon size={13} />}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
