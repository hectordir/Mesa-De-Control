import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchHistorial } from '../../../lib/api/historial'
import type { HistorialParams, HistorialResponse } from '../../../lib/api/types'

/** Clave de consulta por filtros: cualquier cambio dispara un nuevo fetch. */
export const historialKey = (params: HistorialParams) =>
  ['historial', params] as const

/**
 * Sábana de gestiones del Historial General.
 *
 * `keepPreviousData` mantiene la tabla anterior visible mientras llega la nueva
 * página, evitando el parpadeo al paginar/filtrar. Los rechazos (red/servidor)
 * se propagan como error de la consulta para el estado de error de la vista.
 */
export function useHistorial(params: HistorialParams) {
  return useQuery<HistorialResponse>({
    queryKey: historialKey(params),
    queryFn: () => fetchHistorial(params),
    placeholderData: keepPreviousData,
  })
}
