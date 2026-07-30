import { useQuery } from '@tanstack/react-query'
import { getGestion } from '../../../lib/api/gestiones'
import type { GestionResponse } from '../../../lib/api/types'

export const gestionDetalleKey = (id: string) => ['gestion', id] as const

/**
 * Detalle completo de una gestión para precargar el modal de edición.
 * Se consulta solo con un id (`enabled`), y no se cachea entre aperturas
 * (`staleTime: 0`) para no editar sobre datos obsoletos.
 */
export function useGestionDetalle(id: string | null) {
  return useQuery<GestionResponse>({
    queryKey: gestionDetalleKey(id ?? ''),
    queryFn: () => getGestion(id as string),
    enabled: Boolean(id),
    staleTime: 0,
  })
}
