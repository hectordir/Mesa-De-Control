import { useQuery } from '@tanstack/react-query'
import { fetchFibexPlay } from '../../../lib/api/fibex-play'
import type { FibexPlayResumen } from '../../../lib/api/types'

export const fibexPlayKey = ['fibex-play'] as const

/**
 * Estado en vivo de la grilla de canales.
 *
 * `fetchFibexPlay` ya degrada a estado vacío ante error/404, así que la vista
 * solo distingue carga vs. datos.
 */
export function useFibexPlay() {
  return useQuery<FibexPlayResumen>({
    queryKey: fibexPlayKey,
    queryFn: fetchFibexPlay,
  })
}
