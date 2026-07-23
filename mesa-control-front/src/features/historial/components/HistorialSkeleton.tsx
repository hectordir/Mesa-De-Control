/** Esqueleto de carga: cabecera + filas shimmer, sin valores. */
export function HistorialSkeleton({ filas = 8 }: { filas?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando historial"
      className="overflow-hidden rounded-card border border-border bg-surface"
    >
      <div className="h-10 border-b border-border bg-surface-elevated" />
      <div className="flex flex-col">
        {Array.from({ length: filas }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border-subtle px-3 py-[14px]"
          >
            <div className="h-3 w-16 animate-pulse rounded-chip bg-surface-elevated" />
            <div className="h-3 w-32 flex-1 animate-pulse rounded-chip bg-surface-elevated" />
            <div className="h-3 w-24 animate-pulse rounded-chip bg-surface-elevated" />
            <div className="h-5 w-28 animate-pulse rounded-pill bg-surface-elevated" />
            <div className="h-3 w-16 animate-pulse rounded-chip bg-surface-elevated" />
          </div>
        ))}
      </div>
    </div>
  )
}
