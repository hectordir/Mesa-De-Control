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
          label="Abonado / Cliente"
          value={values.abonado}
          error={errors.abonado}
          placeholder="Cond. Los Robles"
          onChange={(v) => setField('abonado', v)}
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
          options={DETALLE_OPCIONES}
          onChange={(v) => setField('detalle', v)}
        />
        <SelectField
          label="Solución Aplicada"
          value={values.solucion}
          error={errors.solucion}
          placeholder="Selecciona una solución"
          options={SOLUCION_OPCIONES}
          onChange={(v) => setField('solucion', v)}
        />
        <SelectField
          label="Resultado de la Gestión"
          value={values.resultado}
          options={RESULTADO_OPCIONES}
          onChange={(v) => setField('resultado', v as GestionFormValues['resultado'])}
        />
        <SelectField
          label="Tipo de Resolución"
          value={values.tipo}
          options={TIPO_OPCIONES}
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
