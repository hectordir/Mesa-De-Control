import { useQuery } from '@tanstack/react-query'
import { fetchAnalisisMensual } from '../../../lib/api/dashboard'
import type { AnalisisMensualResponse } from '../../../lib/api/types'

/** Meta de efectividad del equipo mientras no llegue de configuración. */
export const META_EFECTIVIDAD = 65

export const analisisMensualKey = (periodo: string) =>
  ['analisis-mensual', periodo] as const

/** Respuesta neutra: la vista la interpreta como "mes sin gestiones". */
export function vacioMensual(periodo: string): AnalisisMensualResponse {
  return {
    periodo,
    kpis: {
      volumen: 0,
      resueltos: 0,
      escalados: 0,
      metaEfectividad: META_EFECTIVIDAD,
    },
    serie: [],
    heatmap: { motivos: [], zonas: [] },
  }
}

/**
 * Consolidado mensual del dashboard.
 *
 * Un mes sin gestiones responde 200 con los KPI en 0 y arrays vacíos, así que
 * cualquier rechazo es un fallo real (red o servidor) y se propaga como error.
 */
export function useAnalisisMensual(periodo: string) {
  return useQuery<AnalisisMensualResponse>({
    queryKey: analisisMensualKey(periodo),
    queryFn: () => fetchAnalisisMensual(periodo),
  })
}
