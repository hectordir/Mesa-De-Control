import type { ChartBar, ChartTick } from '../analisis-mensual.derive'

/** Leyenda de las dos series apiladas. */
export function ChartLegend() {
  return (
    <div className="flex items-center gap-[18px]">
      {[
        { label: 'Gestiones Resueltas', color: 'bg-success' },
        { label: 'Resto de Gestiones', color: 'bg-cat-2' },
      ].map((serie) => (
        <div key={serie.label} className="flex items-center gap-[7px]">
          <span
            aria-hidden="true"
            className={`h-[11px] w-[11px] rounded-[3px] ${serie.color}`}
          />
          <span className="text-caption text-text-secondary">{serie.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Etiquetas del eje Y, ancladas por su valor en px. */
export function ChartAxis({ ticks }: { ticks: readonly ChartTick[] }) {
  return (
    <div className="relative h-[300px] w-[38px] flex-shrink-0">
      {ticks.map((tick) => (
        <span
          key={tick.value}
          className="tabular absolute right-0 translate-y-1/2 text-[11px] text-text-muted"
          style={{ bottom: `${tick.bottom}px` }}
        >
          {tick.label}
        </span>
      ))}
    </div>
  )
}

/** Rejilla horizontal del área de trazado. */
export function ChartGrid({ ticks }: { ticks: readonly ChartTick[] }) {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      {ticks.map((tick) => (
        <span
          key={tick.value}
          className="absolute left-0 right-0 h-px bg-border-subtle"
          style={{ bottom: `${tick.bottom}px` }}
        />
      ))}
    </div>
  )
}

function TooltipRow({
  color,
  label,
  valor,
}: {
  color: string
  label: string
  valor: string
}) {
  return (
    <div className="flex items-center gap-[7px] text-caption text-text-secondary">
      <span aria-hidden="true" className={`h-[9px] w-[9px] rounded-[2px] ${color}`} />
      {label}
      <span className="tabular ml-auto pl-[14px] font-bold text-text-primary">
        {valor}
      </span>
    </div>
  )
}

/** Detalle del mes, visible al posar el puntero sobre la columna. */
export function BarTooltip({ bar }: { bar: ChartBar }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 translate-y-[5px] whitespace-nowrap rounded-[9px] border border-border bg-surface-elevated p-[10px] px-3 opacity-0 shadow-elevation transition-[opacity,transform] duration-150 group-hover:translate-y-0 group-hover:opacity-100"
      style={{ bottom: `${bar.tipBottom}px` }}
    >
      <p className="mb-[6px] text-caption font-bold text-text-primary">{bar.name}</p>
      <div className="mb-[3px]">
        <TooltipRow color="bg-success" label="Resueltas" valor={bar.resueltasFmt} />
      </div>
      <div className="mb-[6px]">
        <TooltipRow color="bg-cat-2" label="Resto" valor={bar.restoFmt} />
      </div>
      <div className="flex items-center justify-between gap-[14px] border-t border-border-subtle pt-[6px] text-caption">
        <span className="text-text-muted">Total · {bar.effPct}% efect.</span>
        <span className="tabular font-bold text-text-primary">{bar.totalFmt}</span>
      </div>
    </div>
  )
}

/** Columna apilada de un mes: resto arriba, resueltas abajo. */
export function BarColumn({ bar }: { bar: ChartBar }) {
  return (
    <figure
      aria-label={`${bar.name} · ${bar.totalFmt} gestiones, ${bar.effPct}% de efectividad`}
      className="group relative flex max-w-[96px] flex-1 cursor-default flex-col items-center"
    >
      <BarTooltip bar={bar} />
      <div className="flex w-full max-w-[76px] flex-col overflow-hidden rounded-t-chip transition-[filter] duration-150 group-hover:brightness-110">
        <span
          aria-hidden="true"
          className="block bg-cat-2"
          style={{ height: `${bar.restoPx}px` }}
        />
        <span
          aria-hidden="true"
          className="block bg-success"
          style={{ height: `${bar.resueltasPx}px` }}
        />
      </div>
      <figcaption className="absolute top-full mt-[10px] w-full text-center text-caption font-semibold text-text-secondary">
        {bar.name}
      </figcaption>
    </figure>
  )
}
