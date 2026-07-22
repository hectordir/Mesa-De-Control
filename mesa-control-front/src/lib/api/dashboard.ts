import { api } from './client'
import type { AnalisisMensualResponse, MonitorDiarioResumen } from './types'

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

/**
 * Consolidado mensual del dashboard.
 *
 * `GET /dashboard/analisis-mensual?periodo=YYYY-MM`, protegido con JWT igual
 * que el monitor diario.
 *
 * TODO(api-analisis-mensual): el endpoint todavía no existe en el back; el
 * hook `useAnalisisMensual` captura el 404/error de red y degrada a estado
 * vacío. Cuando el back lo publique, esa captura puede retirarse.
 */
export async function fetchAnalisisMensual(
  periodo: string,
): Promise<AnalisisMensualResponse> {
  const { data } = await api.get<AnalisisMensualResponse>(
    '/dashboard/analisis-mensual',
    { params: { periodo } },
  )
  return data
}
