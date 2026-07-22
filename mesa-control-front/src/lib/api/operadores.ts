import { api } from './client'
import type { OperadorOption } from './types'

/**
 * Pobla el select de operadores del formulario de Nueva Gestión.
 *
 * `GET /operadores` está protegido con JWT; el interceptor de `client.ts`
 * adjunta el token. El back devuelve los usuarios con rol OPERADOR ordenados
 * por nombre. Los errores se propagan tal cual: la vista los interpreta.
 */
export async function getOperadores(): Promise<OperadorOption[]> {
  const { data } = await api.get<OperadorOption[]>('/operadores')
  return data
}
