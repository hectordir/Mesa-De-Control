import { useEffect, useMemo, useRef } from 'react'
import { Button } from '../../../components/ui'
import type { GestionResponse } from '../../../lib/api/types'
import { GestionCampos } from '../../registro/components/GestionCampos'
import { useOperadores } from '../../registro/hooks/useOperadores'
import { toPayload, useGestionForm } from '../../registro/hooks/useGestionForm'
import type { Opcion } from '../../registro/opciones'
import { useEditarGestion } from '../hooks/useEditarGestion'
import { useGestionDetalle } from '../hooks/useGestionDetalle'
import { aValoresFormulario } from '../lib/gestion.form'
import { formatAbonado } from '../lib/historial.presentation'

interface EditarGestionModalProps {
  /** Id de la gestión a editar; `null` cierra el modal. */
  gestionId: string | null
  onClose: () => void
}

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal de edición de una gestión, abierto desde el drawer del Historial.
 * Reutiliza los 14 campos del registro (`GestionCampos`) para que el orden y
 * los controles no diverjan entre alta y edición.
 */
export function EditarGestionModal({
  gestionId,
  onClose,
}: EditarGestionModalProps) {
  if (!gestionId) return null
  return <ModalContenido gestionId={gestionId} onClose={onClose} />
}

function ModalContenido({
  gestionId,
  onClose,
}: {
  gestionId: string
  onClose: () => void
}) {
  const detalle = useGestionDetalle(gestionId)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // El foco entra al diálogo al abrir (y no se pierde tras cargar el detalle).
  useEffect(() => {
    dialogRef.current?.focus()
  }, [detalle.isSuccess])

  /** Ciclo de tabulación confinado al diálogo. */
  function atraparFoco(e: React.KeyboardEvent) {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const nodos = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLES),
    )
    if (nodos.length === 0) return
    const primero = nodos[0]
    const ultimo = nodos[nodos.length - 1]
    const activo = document.activeElement
    if (e.shiftKey && (activo === primero || activo === dialogRef.current)) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && activo === ultimo) {
      e.preventDefault()
      primero.focus()
    }
  }

  const titulo = detalle.data
    ? `Editar gestión · Abonado ${formatAbonado(detalle.data.abonado)}`
    : 'Editar gestión'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Cerrar overlay de edición"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        onKeyDown={atraparFoco}
        className="relative flex max-h-[90vh] w-full max-w-[880px] flex-col rounded-card border border-border bg-bg shadow-elevation focus:outline-none"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-5">
          <h2 className="text-[16px] font-semibold text-text-primary">
            {titulo}
          </h2>
          <button
            type="button"
            aria-label="Cerrar edición"
            onClick={onClose}
            className="rounded-control px-2 py-1 text-[18px] leading-none text-text-muted hover:text-text-primary"
          >
            ×
          </button>
        </div>

        {detalle.isPending ? (
          <p role="status" className="p-6 text-caption text-text-secondary">
            Cargando gestión…
          </p>
        ) : detalle.isError || !detalle.data ? (
          <div className="flex flex-col gap-4 p-6">
            <p role="alert" className="text-caption text-danger">
              No se pudo cargar la gestión. Inténtalo de nuevo.
            </p>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <EditarGestionForm gestion={detalle.data} onClose={onClose} />
        )}
      </div>
    </div>
  )
}

function EditarGestionForm({
  gestion,
  onClose,
}: {
  gestion: GestionResponse
  onClose: () => void
}) {
  const { values, errors, setField, validate } = useGestionForm(
    aValoresFormulario(gestion),
  )
  const editar = useEditarGestion(gestion.id)
  const operadoresQuery = useOperadores()

  const operadores: Opcion[] = useMemo(() => {
    const desdeApi = (operadoresQuery.data ?? []).map((o) => ({
      label: o.nombre,
      value: o.id,
    }))
    // El operador actual puede haber dejado de tener rol OPERADOR: sin esta
    // opción el select caería al placeholder y se perdería la asignación.
    return desdeApi.some((o) => o.value === gestion.operador.id)
      ? desdeApi
      : [{ label: gestion.operador.nombre, value: gestion.operador.id }, ...desdeApi]
  }, [operadoresQuery.data, gestion.operador])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    editar.mutate(toPayload(values), { onSuccess: () => onClose() })
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5"
      onSubmit={handleSubmit}
      noValidate
    >
      <GestionCampos
        values={values}
        errors={errors}
        setField={setField}
        operadores={operadores}
        operadoresLoading={operadoresQuery.isLoading}
        acciones={
          <>
            {editar.isError ? (
              <p role="alert" className="mr-auto text-caption text-danger">
                No se pudo guardar la gestión. Revisa los datos e inténtalo de
                nuevo.
              </p>
            ) : null}
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editar.isPending}>
              {editar.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </>
        }
      />
    </form>
  )
}
