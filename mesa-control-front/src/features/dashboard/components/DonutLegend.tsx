import type { SegmentoDonut } from '../derive'

export function DonutLegend({ segmentos }: { segmentos: readonly SegmentoDonut[] }) {
  return (
    <ul className="flex min-w-[180px] flex-1 flex-col gap-[9px]">
      {segmentos.map((s) => (
        <li key={s.resultado} className="flex items-center gap-[9px]">
          <span
            aria-hidden="true"
            className="h-[10px] w-[10px] flex-shrink-0 rounded-[3px]"
            style={{ background: s.color }}
          />
          <span className="flex-1 text-[13px] text-text-secondary">{s.label}</span>
          <span className="tabular text-[13px] font-semibold text-text-primary">
            {s.total}
          </span>
          <span className="tabular w-[42px] text-right text-caption text-text-muted">
            {s.pct}%
          </span>
        </li>
      ))}
    </ul>
  )
}
