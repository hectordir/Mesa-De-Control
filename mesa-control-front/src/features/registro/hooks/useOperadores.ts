import { useQuery } from '@tanstack/react-query'
import { getOperadores } from '../../../lib/api/operadores'
import type { OperadorOption } from '../../../lib/api/types'

/** Factory de clave, en línea con las de dashboard. */
export const operadoresKey = () => ['operadores'] as const

/** Lista de operadores (rol OPERADOR) para poblar el select del formulario. */
export function useOperadores() {
  return useQuery<OperadorOption[]>({
    queryKey: operadoresKey(),
    queryFn: () => getOperadores(),
  })
}
