import { api } from './client'
import type { MonitorDiarioResumen } from './types'

/**
 * Único punto de acceso a los datos del Monitor Diario.
 *
 * `GET /dashboard/monitor-diario?fecha=YYYY-MM-DD` está protegido con JWT; el
 * interceptor de `client.ts` adjunta el token. Un día sin gestiones responde
 * `200` con los KPI en 0 y arrays vacíos (estado vacío de la vista, no error),
 * así que aquí no hay traducción de errores: se propagan tal cual y la página
 * los muestra en su estado de error.
 */
export async function fetchMonitorDiario(
  fecha: string,
): Promise<MonitorDiarioResumen> {
  const { data } = await api.get<MonitorDiarioResumen>(
    '/dashboard/monitor-diario',
    { params: { fecha } },
  )
  return data
}
