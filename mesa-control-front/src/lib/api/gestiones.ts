import { api } from './client'
import type {
  CreateGestionRequest,
  GestionResponse,
  UpdateGestionRequest,
} from './types'

/**
 * Primera mutación del front: registra una gestión.
 *
 * `POST /gestiones` está protegido con JWT; el interceptor de `client.ts`
 * adjunta el token. Desde la Rev. 2 el body incluye `operadorId` (la autoría la
 * fija el operador seleccionado, ya no `req.user`). El ValidationPipe usa
 * `forbidNonWhitelisted`, así que el payload lleva EXACTAMENTE las claves del
 * DTO. Los errores se propagan tal cual: la página los interpreta.
 */
export async function createGestion(
  payload: CreateGestionRequest,
): Promise<GestionResponse> {
  const { data } = await api.post<GestionResponse>('/gestiones', payload)
  return data
}

/**
 * Detalle completo de una gestión (`GET /gestiones/:id`, JWT).
 * La fila del listado (`GestionRow`) no basta para precargar el formulario de
 * edición: faltan `tipo`, `motivo`, `observacion`, `requiereVisita` y
 * `coordenadas`. `404` si el id no existe (se propaga como error de la query).
 */
export async function getGestion(id: string): Promise<GestionResponse> {
  const { data } = await api.get<GestionResponse>(`/gestiones/${id}`)
  return data
}

/**
 * Edita una gestión (`PATCH /gestiones/:id`, JWT + rol ADMIN/SUPERVISOR).
 * Body parcial con las claves EXACTAS del DTO (`forbidNonWhitelisted`).
 * El back responde `403` si el rol no autoriza y `404` si el id no existe.
 */
export async function updateGestion(
  id: string,
  payload: UpdateGestionRequest,
): Promise<GestionResponse> {
  const { data } = await api.patch<GestionResponse>(`/gestiones/${id}`, payload)
  return data
}
