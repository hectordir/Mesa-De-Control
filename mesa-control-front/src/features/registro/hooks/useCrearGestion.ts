import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGestion } from '../../../lib/api/gestiones'
import type { CreateGestionRequest, GestionResponse } from '../../../lib/api/types'
import { monitorDiarioKey } from '../../dashboard/hooks/useMonitorDiario'
import { analisisMensualKey } from '../../dashboard/hooks/useAnalisisMensual'

/**
 * Prefijos compartidos con las factories de dashboard: invalidar por la cabeza
 * de la clave alcanza cualquier día/mes en caché, así el Monitor Diario y el
 * Análisis Mensual reflejan la gestión recién creada sin conocer la fecha vista.
 */
const [MONITOR_PREFIX] = monitorDiarioKey('')
const [ANALISIS_PREFIX] = analisisMensualKey('')

/**
 * Registra una gestión (`POST /gestiones`) y refresca los dashboards.
 * Modelo `useLogin`: React Query gestiona `isPending`/`isError`; el componente
 * decide el toast y el reset en su propio `onSuccess`.
 */
export function useCrearGestion() {
  const queryClient = useQueryClient()

  return useMutation<GestionResponse, unknown, CreateGestionRequest>({
    mutationFn: (payload) => createGestion(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [MONITOR_PREFIX] })
      void queryClient.invalidateQueries({ queryKey: [ANALISIS_PREFIX] })
    },
  })
}
