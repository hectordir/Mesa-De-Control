import { useEffect, useMemo } from 'react'
import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/auth.store'
import { useCrearGestion } from '../hooks/useCrearGestion'
import { useOperadores } from '../hooks/useOperadores'
import { toPayload, useGestionForm } from '../hooks/useGestionForm'
import type { Opcion } from '../opciones'
import { GestionCampos } from './GestionCampos'

/** `<form>` de Nueva Gestión: estado, validación cliente y envío. */
export function GestionForm({ onGuardado }: { onGuardado: () => void }) {
  const sesionId = useAuthStore((s) => s.user)?.id
  const { values, errors, setField, validate, reset } = useGestionForm()
  const crear = useCrearGestion()
  const operadoresQuery = useOperadores()

  const operadores: Opcion[] = useMemo(
    () =>
      (operadoresQuery.data ?? []).map((o) => ({ label: o.nombre, value: o.id })),
    [operadoresQuery.data],
  )

  // Precarga: el operador de la sesión, si figura entre las opciones cargadas.
  useEffect(() => {
    if (values.operadorId) return
    if (!sesionId) return
    if (operadores.some((o) => o.value === sesionId)) {
      setField('operadorId', sesionId)
    }
  }, [operadores, sesionId, values.operadorId, setField])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    crear.mutate(toPayload(values), {
      onSuccess: () => {
        reset()
        onGuardado()
      },
    })
  }

  function handleReset() {
    reset()
    crear.reset()
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <GestionCampos
        values={values}
        errors={errors}
        setField={setField}
        operadores={operadores}
        operadoresLoading={operadoresQuery.isLoading}
        acciones={
          <>
            {crear.isError ? (
              <p role="alert" className="mr-auto text-caption text-danger">
                No se pudo guardar la gestión. Revisa los datos e inténtalo de
                nuevo.
              </p>
            ) : null}
            <Button type="button" variant="ghost" onClick={handleReset}>
              Limpiar
            </Button>
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? 'Guardando…' : 'Guardar Gestión'}
            </Button>
          </>
        }
      />
    </form>
  )
}
