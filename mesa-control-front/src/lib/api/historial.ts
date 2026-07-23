import { api } from './client'
import type { HistorialParams, HistorialResponse } from './types'

/**
 * Sábana de gestiones (Historial General).
 *
 * `GET /gestiones` está protegido con JWT; el interceptor de `client.ts` adjunta
 * el token. Filtrado, orden y paginación son server-side: se envían los params
 * tal cual y el back los resuelve en Postgres. Los errores se propagan para que
 * la página muestre su estado de error.
 */
export async function fetchHistorial(
  params: HistorialParams,
): Promise<HistorialResponse> {
  const { data } = await api.get<HistorialResponse>('/gestiones', { params })
  return data
}
