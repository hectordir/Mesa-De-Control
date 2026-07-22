import type { ResultadoGestion } from '../../lib/api/types'

export interface Opcion {
  label: string
  value: string
}

/** Etiqueta visible → valor de enum que espera el back. */
export const RESULTADO_OPCIONES: { label: string; value: ResultadoGestion }[] = [
  { label: 'Solucionado en Mesa', value: 'SOLUCIONADO_MESA' },
  { label: 'Enviado a Soporte 2', value: 'ENVIADO_SOPORTE2' },
  { label: 'Escalado a NOC', value: 'ESCALADO_NOC' },
  { label: 'Pendiente Cliente', value: 'PENDIENTE_CLIENTE' },
]

const texto = (valores: string[]): Opcion[] =>
  valores.map((v) => ({ label: v, value: v }))

export const DETALLE_OPCIONES = texto([
  'Falla LOS',
  'Internet Lento',
  'Sin Internet',
  'Caídas Seguidas',
  'No Navega',
  'Usuario Clave GNT',
])

export const SOLUCION_OPCIONES = texto([
  'Reinicio de ONU',
  'Cambio de potencia',
  'Reconfiguración remota',
  'Recableado interno',
  'Reemplazo de equipo',
])

export const TIPO_OPCIONES = texto(['Mesa', 'Soporte 2', 'NOC', 'Visita técnica'])

export const ZONA_OPCIONES = texto([
  'Caraballeda',
  'Caribe',
  'Catia La Mar',
  'El Trébol',
  'La Guaira',
  'La Soublette',
  'Macuto',
  'Maiquetía',
  'Pariata',
  'Tanaguarena',
])

export const MOTIVO_OPCIONES = texto([
  'Corte de fibra',
  'Falla eléctrica',
  'Saturación de nodo',
  'Mantenimiento programado',
  'Afectación por clima',
])
