import type { ReactNode } from 'react'
import { cx } from '../../../components/ui/cx'

/** Estado de cada panel derivado de la consulta. */
export type EstadoPanel = 'data' | 'empty' | 'loading'

interface PanelProps {
  titulo: string
  subtitulo: string
  estado: EstadoPanel
  /** Contenido alineado a la derecha de la cabecera. */
  accion?: ReactNode
  /** Pie fijo del panel (p. ej. la CTA de Telegram). */
  pie?: ReactNode
  children: ReactNode
}

/** Tarjeta de panel con cabecera, estado de carga accesible y pie opcional. */
export function Panel({
  titulo,
  subtitulo,
  estado,
  accion,
  pie,
  children,
}: PanelProps) {
  return (
    <section
      role="region"
      aria-label={titulo}
      aria-busy={estado === 'loading'}
      className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevation"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border-subtle p-4">
        <div>
          <h2 className="text-[14px] font-semibold text-text-primary">{titulo}</h2>
          <p className="mt-[2px] text-caption text-text-muted">{subtitulo}</p>
        </div>
        {accion}
      </div>
      {children}
      {pie}
    </section>
  )
}

interface EmptyStateProps {
  icono: ReactNode
  titulo: string
  descripcion: string
  /** Marco del icono: cuadrado punteado o anillo (donut). */
  marco?: 'cuadro' | 'anillo'
  minHeight: string
}

/** Vacío propio de cada panel, con su icono, título y explicación. */
export function EmptyState({
  icono,
  titulo,
  descripcion,
  marco = 'cuadro',
  minHeight,
}: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center gap-3 p-8 text-center',
        minHeight,
      )}
    >
      <div
        aria-hidden="true"
        className={cx(
          'flex items-center justify-center text-text-muted',
          marco === 'anillo'
            ? 'h-[88px] w-[88px] rounded-pill border-8 border-border-subtle'
            : 'h-[46px] w-[46px] rounded-[11px] border-[1.5px] border-dashed border-border',
        )}
      >
        {icono}
      </div>
      <p className="text-[14px] font-semibold text-text-primary">{titulo}</p>
      <p className="max-w-[240px] text-caption leading-[1.5] text-text-muted">
        {descripcion}
      </p>
    </div>
  )
}

/** Bloque con brillo de carga; siempre decorativo. */
export function Skeleton({ className }: { className: string }) {
  return <span aria-hidden="true" className={cx('block fx-skeleton', className)} />
}

/** Repite `n` veces el contenido de carga. */
export function SkeletonRows({
  count = 5,
  children,
}: {
  count?: number
  children: (indice: number) => ReactNode
}) {
  return (
    <>
      {Array.from({ length: count }, (_, indice) => (
        <div key={indice} aria-hidden="true">
          {children(indice)}
        </div>
      ))}
    </>
  )
}
