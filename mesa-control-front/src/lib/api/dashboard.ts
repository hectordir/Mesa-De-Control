import { resumenDemo } from '../../features/dashboard/fixtures'
import type { MonitorDiarioResumen } from './types'

/**
 * Único punto de acceso a los datos del Monitor Diario.
 *
 * El backend todavía no expone `GET /dashboard/monitor-diario?fecha=…`, así que
 * hoy resolvemos con las fixtures del diseño. Cuando el endpoint exista, basta
 * con sustituir el cuerpo por la llamada HTTP: ningún componente cambia.
 *
 *   const { data } = await api.get<MonitorDiarioResumen>(
 *     '/dashboard/monitor-diario', { params: { fecha } },
 *   )
 *   return data
 */
export async function fetchMonitorDiario(
  fecha: string,
): Promise<MonitorDiarioResumen> {
  return Promise.resolve(resumenDemo(fecha))
}
