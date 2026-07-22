import type { ReactNode } from 'react'
import type { GrupoProps } from './GrupoDatos'
import { MOTIVO_OPCIONES, ZONA_OPCIONES } from '../opciones'
import { SelectField, TextareaField } from './campos'

/** Grupo 3: clasificación (zona, motivo, observación) + acciones del footer. */
export function GrupoClasificacion({
  values,
  errors,
  setField,
  acciones,
}: GrupoProps & { acciones: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-elevation">
      <h2 className="text-h3 font-semibold text-text-primary">
        Clasificación y Cierre
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Zona del Reporte"
          value={values.zona}
          error={errors.zona}
          placeholder="Selecciona una zona"
          options={ZONA_OPCIONES}
          onChange={(v) => setField('zona', v)}
        />
        <SelectField
          label="Motivo de la Incidencia"
          value={values.motivo}
          error={errors.motivo}
          placeholder="Selecciona un motivo"
          options={MOTIVO_OPCIONES}
          onChange={(v) => setField('motivo', v)}
        />
      </div>
      <TextareaField
        label="Observación del SAE"
        value={values.observacion}
        error={errors.observacion}
        placeholder="Describe la atención y el estado de cierre…"
        onChange={(v) => setField('observacion', v)}
      />
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border-subtle pt-4">
        {acciones}
      </div>
    </section>
  )
}
