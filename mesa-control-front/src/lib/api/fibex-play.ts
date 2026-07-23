import { api } from './client'
import type { FibexPlayResumen } from './types'

/** Respuesta neutra: la vista la interpreta como "grilla sin canales". */
export function vacioFibexPlay(): FibexPlayResumen {
  return {
    actualizadoEn: new Date().toISOString(),
    kpis: { total: 0, operativos: 0, caidos: 0, saludGrilla: 100 },
    distribucionSeveridad: [],
    fallas: [],
  }
}

/**
 * Snapshot en vivo de la grilla de canales.
 *
 * `GET /fibex-play` está protegido con JWT; el interceptor de `client.ts`
 * adjunta el token. Mientras el back no publique el endpoint (o ante un fallo
 * de red / 404) degradamos a un estado vacío para no romper la vista: la página
 * lo muestra como "grilla operativa sin canales monitoreados".
 */
export async function fetchFibexPlay(): Promise<FibexPlayResumen> {
  try {
    const { data } = await api.get<FibexPlayResumen>('/fibex-play')
    return data
  } catch {
    return vacioFibexPlay()
  }
}
