import { useMutation, useQueryClient } from '@tanstack/react-query'
import { crearAtencion } from '../../../../lib/api/fibex-play-gestion'
import type {
  CrearAtencionPayload,
  RegistroAtencion,
} from '../../../../lib/api/types'
import { fibexPlayGestionKey } from './useFibexPlayGestion'

/**
 * Registra una atención (`POST /fibex-play/gestion`) y refresca la bitácora.
 * React Query gestiona `isPending`/`isError`; el componente decide el cierre
 * del drawer en su propio `onSuccess`.
 */
export function useCrearAtencion() {
  const queryClient = useQueryClient()

  return useMutation<RegistroAtencion, unknown, CrearAtencionPayload>({
    mutationFn: (payload) => crearAtencion(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fibexPlayGestionKey })
    },
  })
}
