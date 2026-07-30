import type {
  GestionFormErrors,
  GestionFormValues,
} from '../hooks/useGestionForm'
import type { Opcion } from '../opciones'
import {
  DETALLE_OPCIONES,
  RESULTADO_OPCIONES,
  SOLUCION_OPCIONES,
  TIPO_OPCIONES,
  conValorActual,
} from '../opciones'
import { DateField, SegToggle, SelectField, TextField } from './campos'

export interface GrupoProps {
  values: GestionFormValues
  errors: GestionFormErrors
  setField: <K extends keyof GestionFormValues>(
    name: K,
    value: GestionFormValues[K],
  ) => void
}

/** Grupo 1: datos de la gestión (fecha, operador, cliente, clasificación base). */
export function GrupoDatos({
  values,
  errors,
  setField,
  operadores,
  operadoresLoading,
}: GrupoProps & { operadores: Opcion[]; operadoresLoading: boolean }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-elevation">
      <h2 className="text-h3 font-semibold text-text-primary">
        Datos de la Gestión
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DateField
          label="Fecha de la Gestión"
          value={values.fecha}
          onChange={(v) => setField('fecha', v)}
        />
        <SelectField
          label="Operador"
          value={values.operadorId}
          error={errors.operadorId}
          disabled={operadoresLoading}
          placeholder={
            operadoresLoading ? 'Cargando operadores…' : 'Selecciona un operador'
          }
          options={operadores}
          onChange={(v) => setField('operadorId', v)}
        />
        <TextField
          label="Abonado"
          value={values.abonado}
          error={errors.abonado}
          placeholder="N.º de abonado (ej. 100245)"
          onChange={(v) => setField('abonado', v)}
        />
        <TextField
          label="Nombre del Cliente"
          value={values.nombreCliente}
          error={errors.nombreCliente}
          placeholder="María Pérez"
          onChange={(v) => setField('nombreCliente', v)}
        />
        <TextField
          label="Teléfono de Contacto"
          value={values.telefono}
          error={errors.telefono}
          placeholder="0412 555 1234"
          onChange={(v) => setField('telefono', v)}
        />
        <SelectField
          label="Detalle de la Orden"
          value={values.detalle}
          error={errors.detalle}
          placeholder="Selecciona un detalle"
          options={conValorActual(DETALLE_OPCIONES, values.detalle)}
          onChange={(v) => setField('detalle', v)}
        />
        <SelectField
          label="Solución Aplicada"
          value={values.solucion}
          error={errors.solucion}
          placeholder="Selecciona una solución"
          options={conValorActual(SOLUCION_OPCIONES, values.solucion)}
          onChange={(v) => setField('solucion', v)}
        />
        <SelectField
          label="Resultado de la Gestión"
          value={values.resultado}
          options={conValorActual(RESULTADO_OPCIONES, values.resultado)}
          onChange={(v) => setField('resultado', v as GestionFormValues['resultado'])}
        />
        <SelectField
          label="Tipo de Resolución"
          value={values.tipo}
          placeholder="Selecciona un tipo"
          options={conValorActual(TIPO_OPCIONES, values.tipo)}
          onChange={(v) => setField('tipo', v)}
        />
      </div>
      <SegToggle
        label="Requiere Visita Técnica"
        checked={values.requiereVisita}
        onChange={(v) => setField('requiereVisita', v)}
      />
    </section>
  )
}
