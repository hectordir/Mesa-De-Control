import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  deleteGestiones,
  fetchSupervisionResumen,
} from '../../../lib/api/supervision'
import type { SupervisionResumen } from '../../../lib/api/types'

/** Clave de consulta por fecha de auditoría: cambiarla dispara un refetch. */
export const supervisionKey = (fecha: string) => ['supervision', fecha] as const

/**
 * Resumen consolidado de Supervisión para la fecha de auditoría.
 *
 * `keepPreviousData` evita el parpadeo al cambiar de fecha; los rechazos se
 * propagan como error de la consulta para el estado de error de la vista.
 */
export function useSupervision(fecha: string) {
  return useQuery<SupervisionResumen>({
    queryKey: supervisionKey(fecha),
    queryFn: () => fetchSupervisionResumen(fecha),
    placeholderData: keepPreviousData,
  })
}

/**
 * Borrado real de gestiones (Depuración). Al terminar invalida cualquier
 * consulta de supervisión para que la fecha activa recargue con los datos ya sin
 * las filas eliminadas.
 */
export function useDeleteGestiones() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => deleteGestiones(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['supervision'] }),
  })
}
