import { useQuery } from '@tanstack/react-query'
import { fetchMonitorDiario } from '../../../lib/api/dashboard'
import type { MonitorDiarioResumen } from '../../../lib/api/types'

export const monitorDiarioKey = (fecha: string) =>
  ['monitor-diario', fecha] as const

/** Resumen del Monitor Diario para la fecha de operación indicada. */
export function useMonitorDiario(fecha: string) {
  return useQuery<MonitorDiarioResumen>({
    queryKey: monitorDiarioKey(fecha),
    // Envuelto a propósito: React Query v5 pasa un contexto como argumento.
    queryFn: () => fetchMonitorDiario(fecha),
  })
}
