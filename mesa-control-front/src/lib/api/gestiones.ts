import { api } from './client'
import type { CreateGestionRequest, GestionResponse } from './types'

/**
 * Primera mutación del front: registra una gestión.
 *
 * `POST /gestiones` está protegido con JWT; el interceptor de `client.ts`
 * adjunta el token. El `operadorId` lo toma el back de `req.user`, por eso el
 * body NO lo incluye (el ValidationPipe con `forbidNonWhitelisted` lo
 * rechazaría). Los errores se propagan tal cual: la página los interpreta.
 */
export async function createGestion(
  payload: CreateGestionRequest,
): Promise<GestionResponse> {
  const { data } = await api.post<GestionResponse>('/gestiones', payload)
  return data
}
