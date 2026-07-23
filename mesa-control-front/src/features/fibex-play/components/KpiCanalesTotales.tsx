/** KPI · total de canales de la grilla monitoreada. */
export function KpiCanalesTotales({ total }: { total: number }) {
  return (
    <div
      role="group"
      aria-label="Canales Totales"
      className="flex flex-col gap-2 rounded-card border border-border border-l-4 border-l-brand bg-surface p-5 shadow-elevation"
    >
      <span className="text-label uppercase tracking-[.06em] text-text-muted">
        Canales Totales
      </span>
      <span className="tabular text-[46px] font-bold leading-none tracking-[-.02em] text-text-primary">
        {total}
      </span>
      <span className="text-caption text-text-muted">
        canales en la grilla monitoreada
      </span>
    </div>
  )
}
