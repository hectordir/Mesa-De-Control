import { useState } from 'react'
import type { CreateGestionRequest, ResultadoGestion } from '../../../lib/api/types'
import { hoyVE } from '../../../lib/tiempoVE'

/** Estado local del formulario. Desde la Rev. 2 el operador es seleccionable. */
export interface GestionFormValues {
  /** Id del operador al que se atribuye la gestión (select). */
  operadorId: string
  fecha: string
  /** Identificador / nº de abonado. */
  abonado: string
  /** Nombre del cliente asociado al abonado. */
  nombreCliente: string
  telefono: string
  detalle: string
  solucion: string
  resultado: ResultadoGestion
  tipo: string
  requiereVisita: boolean
  coordenadas: string
  zona: string
  motivo: string
  observacion: string
}

export type GestionFormErrors = Partial<Record<keyof GestionFormValues, string>>

/**
 * Campos obligatorios validados en cliente (mismo set que el spec).
 * `observacion` quedó fuera: el back la acepta vacía y hay filas sembradas sin
 * ella, que de otro modo no se podrían guardar desde el modal de edición.
 */
export const CAMPOS_OBLIGATORIOS = [
  'abonado',
  'nombreCliente',
  'telefono',
  'detalle',
  'solucion',
  'zona',
  'motivo',
] as const

export const MENSAJE_OBLIGATORIO = 'Este campo es obligatorio'

/** Fecha de hoy en 'YYYY-MM-DD', en la hora de la operación (Venezuela). */
export function hoy(): string {
  return hoyVE()
}

function valoresIniciales(): GestionFormValues {
  return {
    operadorId: '',
    fecha: hoy(),
    abonado: '',
    nombreCliente: '',
    telefono: '',
    detalle: '',
    solucion: '',
    resultado: 'SOLUCIONADO_MESA',
    tipo: 'Mesa',
    requiereVisita: false,
    coordenadas: '',
    zona: '',
    motivo: '',
    observacion: '',
  }
}

/** Traduce el estado del formulario al contrato exacto de `POST /gestiones`. */
export function toPayload(values: GestionFormValues): CreateGestionRequest {
  return {
    operadorId: values.operadorId,
    fecha: values.fecha,
    abonado: values.abonado.trim(),
    nombreCliente: values.nombreCliente.trim(),
    telefono: values.telefono.trim(),
    detalle: values.detalle,
    solucion: values.solucion,
    resultado: values.resultado,
    tipo: values.tipo,
    requiereVisita: values.requiereVisita,
    zona: values.zona,
    motivo: values.motivo,
    observacion: values.observacion.trim(),
    coordenadas: values.coordenadas.trim() || null,
  }
}

/**
 * Estado y validación del formulario de gestión (registro y edición).
 *
 * - **Creación** (`iniciales` ausente): arranca en los valores por defecto y
 *   `reset` limpia conservando la fecha y el operador seleccionado.
 * - **Edición** (`iniciales` presente): arranca en los valores inyectados y
 *   `reset` vuelve exactamente a ellos (deshacer los cambios del formulario).
 *
 * Los iniciales se congelan en el primer render: el modal de edición monta el
 * formulario solo cuando el detalle ya llegó, así que no hay resincronización.
 */
export function useGestionForm(iniciales?: Partial<GestionFormValues>) {
  const [base] = useState<GestionFormValues | null>(() =>
    iniciales ? { ...valoresIniciales(), ...iniciales } : null,
  )
  const [values, setValues] = useState<GestionFormValues>(
    () => base ?? valoresIniciales(),
  )
  const [errors, setErrors] = useState<GestionFormErrors>({})

  function setField<K extends keyof GestionFormValues>(
    name: K,
    value: GestionFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [name]: value }))
    // limpiar el error del campo en cuanto el operador lo corrige
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev))
  }

  function validate(): boolean {
    const next: GestionFormErrors = {}
    for (const campo of CAMPOS_OBLIGATORIOS) {
      if (!String(values[campo]).trim()) next[campo] = MENSAJE_OBLIGATORIO
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function reset() {
    setValues((prev) =>
      base
        ? base
        : { ...valoresIniciales(), fecha: prev.fecha, operadorId: prev.operadorId },
    )
    setErrors({})
  }

  return { values, errors, setField, validate, reset }
}
