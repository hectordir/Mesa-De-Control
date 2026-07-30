import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGestion } from '../../../lib/api/gestiones'
import type { GestionResponse, UpdateGestionRequest } from '../../../lib/api/types'
import { monitorDiarioKey } from '../../dashboard/hooks/useMonitorDiario'
import { analisisMensualKey } from '../../dashboard/hooks/useAnalisisMensual'
import { historialKey } from './useHistorial'

/**
 * Prefijos de clave: invalidar por la cabeza alcanza cualquier filtro/día/mes
 * en caché. El historial es imprescindible aquí (su clave lleva los filtros
 * completos, así que sin el prefijo la tabla no refrescaría tras editar).
 */
const [HISTORIAL_PREFIX] = historialKey({})
const [MONITOR_PREFIX] = monitorDiarioKey('')
const [ANALISIS_PREFIX] = analisisMensualKey('')

/**
 * Edita una gestión (`PATCH /gestiones/:id`) y refresca historial y dashboards.
 * Modelo `useCrearGestion`: React Query gestiona `isPending`/`isError`; el
 * componente decide el cierre del modal en su propio `onSuccess`.
 */
export function useEditarGestion(id: string) {
  const queryClient = useQueryClient()

  return useMutation<GestionResponse, unknown, UpdateGestionRequest>({
    mutationFn: (payload) => updateGestion(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [HISTORIAL_PREFIX] })
      void queryClient.invalidateQueries({ queryKey: [MONITOR_PREFIX] })
      void queryClient.invalidateQueries({ queryKey: [ANALISIS_PREFIX] })
    },
  })
}
