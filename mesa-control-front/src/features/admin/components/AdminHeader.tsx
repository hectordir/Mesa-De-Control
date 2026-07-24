/** Título de la sección + badge Admin + selector "Fecha Auditoría". */
export function AdminHeader({
  fecha,
  onFechaChange,
}: {
  fecha: string
  onFechaChange: (fecha: string) => void
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-[10px]">
          <h1 className="text-h2 font-bold tracking-[-.02em] text-text-primary">
            Supervisión
          </h1>
          <span className="rounded-pill bg-brand-nav px-[10px] py-[3px] text-[11px] font-semibold uppercase tracking-[.06em] text-brand">
            Admin
          </span>
        </div>
        <p className="text-caption text-text-muted">
          Vista de auditoría para responsables de la mesa · métricas consolidadas
          del día
        </p>
      </div>
      <label className="flex items-center gap-[10px] rounded-card border border-border bg-surface px-3 py-2 shadow-elevation">
        <span className="text-caption font-semibold text-text-secondary">
          Fecha Auditoría
        </span>
        <input
          type="date"
          aria-label="Fecha Auditoría"
          value={fecha}
          onChange={(e) => onFechaChange(e.target.value)}
          className="rounded-control border border-border bg-bg px-[10px] py-[7px] text-[13px] font-semibold text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring"
        />
      </label>
    </div>
  )
}
