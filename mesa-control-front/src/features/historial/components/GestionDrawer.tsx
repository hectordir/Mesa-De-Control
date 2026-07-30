import { useEffect } from 'react'
import { Button } from '../../../components/ui'
import type { GestionRow } from '../../../lib/api/types'
import { useAuthStore } from '../../../stores/auth.store'
import {
  formatAbonado,
  formatFecha,
  textoODash,
} from '../lib/historial.presentation'
import { ResultadoChip } from './ResultadoChip'

interface GestionDrawerProps {
  gestion: GestionRow | null
  onClose: () => void
  /** Abre la edición de esta gestión (solo ADMIN/SUPERVISOR). */
  onEditar?: (gestion: GestionRow) => void
}

/** Detalle de una gestión: drawer lateral (desktop) / bottom-sheet (móvil). */
export function GestionDrawer({ gestion, onClose, onEditar }: GestionDrawerProps) {
  if (!gestion) return null
  return (
    <DrawerContenido gestion={gestion} onClose={onClose} onEditar={onEditar} />
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label uppercase text-text-muted">{label}</span>
      <span className="text-caption text-text-primary">{children}</span>
    </div>
  )
}

/**
 * Sello de última modificación: `DD/MM/YYYY hh:mm a. m.` (sin editor: va aparte).
 * "Nunca editada" es información, no un dato faltante → texto explícito.
 */
function selloModificacion(gestion: GestionRow): string {
  if (!gestion.modificadaFecha) return 'Sin modificaciones'
  return [gestion.modificadaFecha, gestion.modificadaHora].filter(Boolean).join(' ')
}

function DrawerContenido({
  gestion,
  onClose,
  onEditar,
}: {
  gestion: GestionRow
  onClose: () => void
  onEditar?: (gestion: GestionRow) => void
}) {
  // La edición está reservada a ADMIN y SUPERVISOR (el back responde 403 al
  // resto): el botón ni siquiera se ofrece a un OPERADOR.
  const role = useAuthStore((s) => s.user)?.role
  const puedeEditar = role === 'ADMIN' || role === 'SUPERVISOR'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-stretch lg:justify-end">
      <button
        type="button"
        aria-label="Cerrar overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de gestión · Abonado ${formatAbonado(gestion.abonado)}`}
        className="relative flex max-h-[85vh] w-full flex-col rounded-t-card border border-border bg-surface shadow-elevation lg:h-full lg:max-h-full lg:w-[440px] lg:max-w-[440px] lg:rounded-none lg:border-l"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-[16px] font-semibold text-text-primary">
              {textoODash(gestion.nombreCliente)}
            </h2>
            <ResultadoChip resultado={gestion.resultado} className="mt-1" />
          </div>
          <button
            type="button"
            aria-label="Cerrar detalle"
            onClick={onClose}
            className="rounded-control px-2 py-1 text-[18px] leading-none text-text-muted hover:text-text-primary"
          >
            ×
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto p-5">
          {/* Tres pares completos, sin huecos: cliente (abonado/teléfono),
              atención (zona/operador) y auditoría (creada/modificada). */}
          <Campo label="Abonado">{formatAbonado(gestion.abonado)}</Campo>
          <Campo label="Teléfono">{textoODash(gestion.telefono)}</Campo>
          <Campo label="Zona">{gestion.zona}</Campo>
          <Campo label="Operador">{gestion.operador.nombre}</Campo>
          {/* Auditoría: "Creada" solo lleva la fecha del formulario (la hora
              disponible viene de createdAt y mezclarlas engaña); "Modificada"
              sí lleva hora, la real de updatedAt, ya en 12h desde el back. */}
          <Campo label="Creada">{formatFecha(gestion.fecha)}</Campo>
          <Campo label="Modificada">{selloModificacion(gestion)}</Campo>
          {/* Sin edición no hay editor del que hablar: el campo no se pinta.
              Si la hubo, el editor puede faltar igualmente (FK ON DELETE SET
              NULL) → guion, como el resto de datos ausentes del drawer. */}
          {gestion.modificadaFecha ? (
            <div className="col-span-2">
              <Campo label="Modificada por">{gestion.editor?.nombre ?? '—'}</Campo>
            </div>
          ) : null}
          <div className="col-span-2">
            <Campo label="Detalle de la orden">{gestion.detalle}</Campo>
          </div>
          <div className="col-span-2">
            <Campo label="Solución aplicada">{gestion.solucion}</Campo>
          </div>
        </div>

        {puedeEditar ? (
          <div className="flex items-center justify-end gap-3 border-t border-border-subtle p-5">
            <Button variant="primary" onClick={() => onEditar?.(gestion)}>
              Editar gestión
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
