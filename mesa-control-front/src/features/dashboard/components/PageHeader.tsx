import type { ReactNode } from 'react'
import { DashboardViewToggle } from './DashboardViewToggle'

/**
 * Ancho mínimo del bloque derecho (fecha de operación / filtro mensual): con él
 * el toggle conserva la misma posición aunque el control cambie de contenido.
 * Lo fija el más ancho de los dos, el filtro mensual con "Volver al mes actual"
 * y el mes de etiqueta más larga ("Septiembre 2026").
 */
const ANCHO_CONTROL = 'min-w-[480px]'

interface PageHeaderProps {
  titulo: string
  subtitulo: string
  /** Control derecho de la vista: fecha de operación o filtro mensual. */
  children: ReactNode
}

/** Encabezado común del dashboard: título, selector de vista y control. */
export function PageHeader({ titulo, subtitulo, children }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold leading-tight tracking-[-.02em]">
          {titulo}
        </h1>
        <p className="text-[13px] text-text-muted">{subtitulo}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DashboardViewToggle />
        <div
          data-testid="header-control"
          className={`flex justify-end ${ANCHO_CONTROL}`}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
