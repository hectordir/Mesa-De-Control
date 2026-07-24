import { api } from './client'
import type { DeleteGestionesResult, SupervisionResumen } from './types'

/**
 * Resumen consolidado de Supervisión para la fecha de auditoría.
 *
 * `GET /supervision/resumen` está protegido con JWT y rol ADMIN/SUPERVISOR; el
 * interceptor de `client.ts` adjunta el token. `fecha` es opcional: sin ella el
 * back usa el día de hoy. Los errores se propagan para el estado de error de la
 * vista.
 */
export async function fetchSupervisionResumen(
  fecha?: string,
): Promise<SupervisionResumen> {
  const { data } = await api.get<SupervisionResumen>('/supervision/resumen', {
    params: fecha ? { fecha } : {},
  })
  return data
}

/**
 * Depura (borra realmente) las gestiones indicadas.
 *
 * `DELETE /supervision/gestiones` recibe los ids en el body. Devuelve cuántas se
 * eliminaron. `ids` no puede estar vacío (el back responde 400).
 */
export async function deleteGestiones(
  ids: string[],
): Promise<DeleteGestionesResult> {
  const { data } = await api.delete<DeleteGestionesResult>(
    '/supervision/gestiones',
    { data: { ids } },
  )
  return data
}
