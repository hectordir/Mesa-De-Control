import type { ResultadoGestion } from '../../lib/api/types'

/**
 * Metadatos de cada resultado de gestión: etiqueta, verbo para el radar y los
 * colores de token (serie categórica para el donut, tono semántico para el
 * radar). Único mapa reutilizado por ambos paneles.
 */
export interface ResultadoMeta {
  /** Etiqueta de la leyenda del donut. */
  label: string
  /** Acción en pasado que se lee en el radar: "Jhon Rivas <accion>". */
  accion: string
  /** Color de serie (`--color-cat-N`) del donut. */
  serie: string
  /** Tono semántico usado por el avatar del radar. */
  tono: string
  /** Fondo del avatar del radar (tono al 18 % sobre la superficie). */
  tonoSuave: string
}

export const resultadoMeta: Record<ResultadoGestion, ResultadoMeta> = {
  SOLUCIONADO_MESA: {
    label: 'Solucionado en Mesa',
    accion: 'solucionó en Mesa',
    serie: 'var(--color-cat-2)',
    tono: 'var(--color-success)',
    tonoSuave: 'var(--color-success-soft)',
  },
  ENVIADO_SOPORTE2: {
    label: 'Enviado a Soporte 2',
    accion: 'envió a Soporte 2',
    serie: 'var(--color-cat-3)',
    tono: 'var(--color-warning)',
    tonoSuave: 'var(--color-warning-soft)',
  },
  ESCALADO_NOC: {
    label: 'Escalado a NOC',
    accion: 'escaló a NOC',
    serie: 'var(--color-cat-5)',
    tono: 'var(--color-danger)',
    tonoSuave: 'var(--color-danger-soft)',
  },
  PENDIENTE_CLIENTE: {
    label: 'Pendiente Cliente',
    accion: 'marcó Pendiente Cliente',
    serie: 'var(--color-cat-1)',
    tono: 'var(--color-info)',
    tonoSuave: 'var(--color-info-soft)',
  },
  REAGENDADO: {
    label: 'Reagendado',
    accion: 'reagendó la visita',
    serie: 'var(--color-cat-4)',
    tono: 'var(--color-neutral)',
    tonoSuave: 'var(--color-neutral-soft)',
  },
}
