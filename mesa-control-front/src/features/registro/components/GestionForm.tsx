import { Button } from '../../../components/ui/Button'
import { useAuthStore } from '../../../stores/auth.store'
import { useCrearGestion } from '../hooks/useCrearGestion'
import { toPayload, useGestionForm } from '../hooks/useGestionForm'
import { GrupoClasificacion } from './GrupoClasificacion'
import { GrupoDatos } from './GrupoDatos'
import { GrupoUbicacion } from './GrupoUbicacion'

/** `<form>` de Nueva Gestión: estado, validación cliente y envío. */
export function GestionForm({ onGuardado }: { onGuardado: () => void }) {
  const operador = useAuthStore((s) => s.user)?.name ?? ''
  const { values, errors, setField, validate, reset } = useGestionForm()
  const crear = useCrearGestion()

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
      <GrupoDatos
        values={values}
        errors={errors}
        setField={setField}
        operador={operador}
      />
      <GrupoUbicacion values={values} errors={errors} setField={setField} />
      <GrupoClasificacion
        values={values}
        errors={errors}
        setField={setField}
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
