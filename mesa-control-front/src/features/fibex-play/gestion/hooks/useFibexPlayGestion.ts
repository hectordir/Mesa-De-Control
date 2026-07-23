import { useQuery } from '@tanstack/react-query'
import { fetchFibexPlayGestion } from '../../../../lib/api/fibex-play-gestion'
import type { GestionResumen } from '../../../../lib/api/types'

export const fibexPlayGestionKey = ['fibex-play-gestion'] as const

/**
 * Resumen de la bitácora de atención de la App Fibex.
 *
 * `fetchFibexPlayGestion` ya degrada a estado vacío ante error/404, así que la
 * vista solo distingue carga vs. datos.
 */
export function useFibexPlayGestion() {
  return useQuery<GestionResumen>({
    queryKey: fibexPlayGestionKey,
    queryFn: fetchFibexPlayGestion,
  })
}
