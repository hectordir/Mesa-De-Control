import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button } from '../../../../components/ui'
import { cx } from '../../../../components/ui/cx'
import type {
  CrearAtencionPayload,
  EstadoAtencion,
  GestionCatalogos,
} from '../../../../lib/api/types'
import type { Opcion } from '../../../registro/opciones'
import { SelectField } from '../../../registro/components/campos/SelectField'
import { TextField } from '../../../registro/components/campos/TextField'
import { FieldShell } from '../../../registro/components/campos/FieldShell'
import { controlClass } from '../../../registro/components/campos/controlClass'
import { useOperadores } from '../../../registro/hooks/useOperadores'
import { useCrearAtencion } from '../hooks/useCrearAtencion'
import { ESTADO_OPCIONES } from '../lib/gestion.presentation'

interface NuevoRegistroDrawerProps {
  open: boolean
  catalogos: GestionCatalogos
  onClose: () => void
}

const opciones = (valores: string[]): Opcion[] =>
  valores.map((v) => ({ label: v, value: v }))

interface FormState {
  operadorId: string
  abonado: string
  canal: string
  motivo: string
  solucion: string
  estado: EstadoAtencion
}

const INICIAL: FormState = {
  operadorId: '',
  abonado: '',
  canal: '',
  motivo: '',
  solucion: '',
  estado: 'SOLUCIONADO',
}

/**
 * Drawer lateral con el formulario de alta de una atención de la App Fibex.
 * Monta el contenido solo cuando `open`, de modo que el formulario arranca
 * limpio en cada apertura (estado inicial vía `useState`, sin reset en efecto).
 */
export function NuevoRegistroDrawer({
  open,
  catalogos,
  onClose,
}: NuevoRegistroDrawerProps) {
  if (!open) return null
  return (
    <DrawerContenido catalogos={catalogos} onClose={onClose} />
  )
}

function DrawerContenido({
  catalogos,
  onClose,
}: {
  catalogos: GestionCatalogos
  onClose: () => void
}) {
  const [form, setForm] = useState<FormState>(INICIAL)
  const operadoresQuery = useOperadores(true)
  const crear = useCrearAtencion()
  const primeroRef = useRef<HTMLSelectElement>(null)

  const operadorOpciones: Opcion[] = useMemo(
    () =>
      (operadoresQuery.data ?? []).map((o) => ({
        label: o.nombre,
        value: o.id,
      })),
    [operadoresQuery.data],
  )

  useEffect(() => {
    primeroRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (campo: keyof FormState) => (valor: string) =>
    setForm((f) => ({ ...f, [campo]: valor }))

  const completo =
    form.operadorId !== '' &&
    form.abonado.trim() !== '' &&
    form.canal !== '' &&
    form.motivo !== '' &&
    form.solucion !== ''

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!completo) return
    const payload: CrearAtencionPayload = {
      operadorId: form.operadorId,
      abonado: form.abonado.trim(),
      canal: form.canal,
      motivo: form.motivo,
      solucion: form.solucion,
      estado: form.estado,
    }
    crear.mutate(payload, { onSuccess: () => onClose() })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo Registro"
        className="fx-drawer-in relative flex h-full w-full max-w-[440px] flex-col border-l border-border bg-surface shadow-elevation"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-semibold text-text-primary">
              Nuevo Registro
            </h2>
            <p className="text-caption text-text-muted">
              Registra una atención de reporte por la App Fibex.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-control px-2 py-1 text-[18px] leading-none text-text-muted hover:text-text-primary"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            <SelectFieldRef
              ref={primeroRef}
              label="Operador"
              value={form.operadorId}
              onChange={set('operadorId')}
              options={operadorOpciones}
              placeholder="Selecciona un operador"
            />
            <TextField
              label="Número de abonado"
              value={form.abonado}
              onChange={set('abonado')}
              placeholder="Nombre, condominio o nº de cuenta"
            />
            <SelectField
              label="Canal"
              value={form.canal}
              onChange={set('canal')}
              options={opciones(catalogos.canales)}
              placeholder="Selecciona un canal"
            />
            <SelectField
              label="Motivo"
              value={form.motivo}
              onChange={set('motivo')}
              options={opciones(catalogos.motivos)}
              placeholder="Selecciona un motivo"
            />
            <SelectField
              label="Solución aplicada"
              value={form.solucion}
              onChange={set('solucion')}
              options={opciones(catalogos.soluciones)}
              placeholder="Selecciona una solución"
            />

            <div className="flex flex-col gap-1">
              <span className="text-label uppercase text-text-muted">Estado</span>
              <div
                role="radiogroup"
                aria-label="Estado"
                className="flex gap-[2px] rounded-control border border-border bg-bg p-[3px]"
              >
                {ESTADO_OPCIONES.map((opt) => {
                  const activo = form.estado === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={activo}
                      onClick={() =>
                        setForm((f) => ({ ...f, estado: opt.value }))
                      }
                      className={cx(
                        'flex-1 rounded-chip px-[10px] py-[7px] text-[13px]',
                        activo
                          ? 'border border-border bg-surface font-semibold text-text-primary shadow-elevation'
                          : 'border border-transparent font-medium text-text-secondary',
                      )}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {crear.isError ? (
              <p role="alert" className="text-caption text-danger">
                No se pudo guardar el registro. Inténtalo de nuevo.
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border-subtle p-5">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!completo || crear.isPending}
            >
              Guardar Registro
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Variante de SelectField que expone una ref para el foco inicial ─────────── */
const SelectFieldRef = forwardRef<
  HTMLSelectElement,
  {
    label: string
    value: string
    onChange: (value: string) => void
    options: readonly Opcion[]
    placeholder?: string
  }
>(function SelectFieldRef({ label, value, onChange, options, placeholder }, ref) {
  const id = useId()
  return (
    <FieldShell id={id} label={label}>
      <select
        id={id}
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={controlClass()}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
})
