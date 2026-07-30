import type { ReactNode } from 'react'
import type { Opcion } from '../opciones'
import { GrupoClasificacion } from './GrupoClasificacion'
import { GrupoDatos, type GrupoProps } from './GrupoDatos'
import { GrupoUbicacion } from './GrupoUbicacion'

export type GestionCamposProps = GrupoProps & {
  operadores: Opcion[]
  operadoresLoading: boolean
  /** Footer del último grupo: botonera de la pantalla que lo envuelve. */
  acciones: ReactNode
}

/**
 * Los 14 campos de una gestión, en el orden canónico del spec, agrupados en las
 * tres secciones de la pantalla de registro. Lo comparten Nueva Gestión y el
 * modal de edición del Historial: así el orden y los controles no divergen.
 */
export function GestionCampos({
  values,
  errors,
  setField,
  operadores,
  operadoresLoading,
  acciones,
}: GestionCamposProps) {
  return (
    <>
      <GrupoDatos
        values={values}
        errors={errors}
        setField={setField}
        operadores={operadores}
        operadoresLoading={operadoresLoading}
      />
      <GrupoUbicacion values={values} errors={errors} setField={setField} />
      <GrupoClasificacion
        values={values}
        errors={errors}
        setField={setField}
        acciones={acciones}
      />
    </>
  )
}
