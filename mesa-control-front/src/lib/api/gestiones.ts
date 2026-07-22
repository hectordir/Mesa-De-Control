import { api } from './client'
import type { CreateGestionRequest, GestionResponse } from './types'

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
