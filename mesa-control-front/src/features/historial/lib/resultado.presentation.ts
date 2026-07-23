import type { ResultadoGestion } from '../../../lib/api/types'

/** Tonos semánticos disponibles (subconjunto de `BadgeTone` del UI kit). */
export type ResultadoTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export interface ResultadoPresentation {
  label: string
  tone: ResultadoTone
}

/**
 * TODO(enum-keys): las CLAVES de este mapa son los valores CRUDOS del enum
 * `ResultadoGestion` del backend. Es el ÚNICO lugar donde se traduce el enum a
 * etiqueta + tono; si el back publica identificadores distintos, ajustar SOLO
 * aquí. `resultadoPresentation` degrada con un default seguro (tono neutral y
 * el valor crudo como etiqueta) para cualquier valor desconocido.
 */
const RESULTADO_MAP: Record<string, ResultadoPresentation> = {
  SOLUCIONADO_MESA: { label: 'Solucionado en Mesa', tone: 'success' },
  ENVIADO_SOPORTE2: { label: 'Enviado a Soporte 2', tone: 'warning' },
  ESCALADO_NOC: { label: 'Escalado a NOC', tone: 'danger' },
  PENDIENTE_CLIENTE: { label: 'Pendiente Cliente', tone: 'info' },
  REAGENDADO: { label: 'Reagendado', tone: 'neutral' },
}

/** Traduce un valor del enum a `{label, tone}`; default seguro si no se conoce. */
export function resultadoPresentation(resultado: string): ResultadoPresentation {
  return RESULTADO_MAP[resultado] ?? { label: resultado, tone: 'neutral' }
}

/** Orden fijo de los resultados para las chips (sigue el orden del diseño). */
export const RESULTADOS_ORDEN: ResultadoGestion[] = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
]
