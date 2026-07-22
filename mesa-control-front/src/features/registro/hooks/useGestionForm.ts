import { useState } from 'react'
import type { CreateGestionRequest, ResultadoGestion } from '../../../lib/api/types'

/** Estado local del formulario. Desde la Rev. 2 el operador es seleccionable. */
export interface GestionFormValues {
  /** Id del operador al que se atribuye la gestión (select). */
  operadorId: string
  fecha: string
  abonado: string
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

/** Campos obligatorios validados en cliente (mismo set que el spec). */
export const CAMPOS_OBLIGATORIOS = [
  'abonado',
  'telefono',
  'detalle',
  'solucion',
  'zona',
  'motivo',
  'observacion',
] as const

export const MENSAJE_OBLIGATORIO = 'Este campo es obligatorio'

/** Fecha de hoy en formato 'YYYY-MM-DD' (hora local del operador). */
export function hoy(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

function valoresIniciales(): GestionFormValues {
  return {
    operadorId: '',
    fecha: hoy(),
    abonado: '',
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
 * Estado y validación del formulario de Nueva Gestión.
 * `reset` conserva la fecha y el operador seleccionado.
 */
export function useGestionForm() {
  const [values, setValues] = useState<GestionFormValues>(valoresIniciales)
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
    setValues((prev) => ({
      ...valoresIniciales(),
      fecha: prev.fecha,
      operadorId: prev.operadorId,
    }))
    setErrors({})
  }

  return { values, errors, setField, validate, reset }
}
