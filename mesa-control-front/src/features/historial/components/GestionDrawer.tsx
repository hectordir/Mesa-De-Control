import { useEffect } from 'react'
import { Button } from '../../../components/ui'
import type { GestionRow } from '../../../lib/api/types'
import { formatDuracion, formatFecha } from '../lib/historial.presentation'
import { ResultadoChip } from './ResultadoChip'

interface GestionDrawerProps {
  gestion: GestionRow | null
  onClose: () => void
}

/** Detalle de una gestión: drawer lateral (desktop) / bottom-sheet (móvil). */
export function GestionDrawer({ gestion, onClose }: GestionDrawerProps) {
  if (!gestion) return null
  return <DrawerContenido gestion={gestion} onClose={onClose} />
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-label uppercase text-text-muted">{label}</span>
      <span className="text-caption text-text-primary">{children}</span>
    </div>
  )
}

function DrawerContenido({
  gestion,
  onClose,
}: {
  gestion: GestionRow
  onClose: () => void
}) {
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
        aria-label={`Detalle de gestión ${gestion.codigo}`}
        className="relative flex max-h-[85vh] w-full flex-col rounded-t-card border border-border bg-surface shadow-elevation lg:h-full lg:max-h-full lg:w-[440px] lg:max-w-[440px] lg:rounded-none lg:border-l"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-5">
          <div className="flex flex-col gap-1">
            <span className="text-label uppercase text-text-muted">
              {gestion.codigo}
            </span>
            <h2 className="text-[16px] font-semibold text-text-primary">
              {gestion.abonado}
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
          <Campo label="Operador">{gestion.operador.nombre}</Campo>
          <Campo label="Teléfono">{gestion.telefono}</Campo>
          <Campo label="Zona">{gestion.zona}</Campo>
          <Campo label="Canal">{gestion.canal ?? '—'}</Campo>
          <Campo label="Fecha">{formatFecha(gestion.fecha)}</Campo>
          <Campo label="Hora">{gestion.hora}</Campo>
          <Campo label="Duración">{formatDuracion(gestion.duracionMin)}</Campo>
          <div className="col-span-2">
            <Campo label="Detalle de la orden">{gestion.detalle}</Campo>
          </div>
          <div className="col-span-2">
            <Campo label="Solución aplicada">{gestion.solucion}</Campo>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-subtle p-5">
          {/* TODO(navegación): sin acción por ahora — edición/ficha de abonado futuras. */}
          <Button variant="secondary" onClick={() => {}}>
            Ver abonado
          </Button>
          <Button variant="primary" onClick={() => {}}>
            Editar gestión
          </Button>
        </div>
      </div>
    </div>
  )
}
