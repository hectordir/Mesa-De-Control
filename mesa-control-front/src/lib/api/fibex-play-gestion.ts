import { api } from './client'
import type {
  CrearAtencionPayload,
  GestionResumen,
  RegistroAtencion,
} from './types'

/** Respuesta neutra: la vista la interpreta como "bitácora sin registros". */
export function vacioGestion(): GestionResumen {
  return {
    kpis: { totalAtendidos: 0, solucionados: 0, enProceso: 0, escalados: 0 },
    topCanales: [],
    origen: [],
    registros: [],
    catalogos: { canales: [], motivos: [], soluciones: [], estados: [] },
  }
}

/**
 * Resumen de la bitácora de atención de la App Fibex.
 *
 * `GET /fibex-play/gestion` está protegido con JWT; el interceptor de
 * `client.ts` adjunta el token. Ante error/404 (back aún sin publicar el
 * endpoint) degradamos a estado vacío para no romper la vista, patrón de
 * `fetchAnalisisMensual` / `fetchFibexPlay`.
 */
export async function fetchFibexPlayGestion(): Promise<GestionResumen> {
  try {
    const { data } = await api.get<GestionResumen>('/fibex-play/gestion')
    return data
  } catch {
    return vacioGestion()
  }
}

/** Crea un registro de atención (`POST /fibex-play/gestion`). */
export async function crearAtencion(
  payload: CrearAtencionPayload,
): Promise<RegistroAtencion> {
  const { data } = await api.post<RegistroAtencion>(
    '/fibex-play/gestion',
    payload,
  )
  return data
}
