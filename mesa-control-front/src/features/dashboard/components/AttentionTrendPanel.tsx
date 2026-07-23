import type { Tendencia } from '../analisis-mensual.derive'
import { TREND_H, TREND_W } from '../analisis-mensual.derive'
import { Panel } from './PanelStates'

/** Serie diaria de atención como área + línea SVG, con rejilla y eje X. */
export function AttentionTrendPanel({ tendencia }: { tendencia: Tendencia }) {
  return (
    <Panel
      titulo="Tendencia de Atención Mensual"
      subtitulo="Clientes atendidos día a día"
      estado="data"
    >
      <div className="px-5 pb-3 pt-5">
        <div className="flex gap-[10px]">
          <div
            className="relative w-[26px] flex-shrink-0"
            style={{ height: `${TREND_H}px` }}
          >
            {tendencia.grid.map((g) => (
              <span
                key={g.label}
                className="tabular absolute right-0 translate-y-1/2 text-[10.5px] text-text-muted"
                style={{ bottom: `${g.bottom}px` }}
              >
                {g.label}
              </span>
            ))}
          </div>
          <div
            className="relative min-w-0 flex-1"
            style={{ height: `${TREND_H}px` }}
          >
            <svg
              viewBox={`0 0 ${TREND_W} ${TREND_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              role="img"
              aria-label="Tendencia de clientes atendidos día a día"
            >
              <defs>
                <linearGradient id="fxTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--color-brand)" stopOpacity="0.32" />
                  <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {tendencia.grid.map((g) => (
                <line
                  key={g.label}
                  x1="0"
                  y1={g.y}
                  x2={TREND_W}
                  y2={g.y}
                  stroke="var(--color-border-subtle)"
                  strokeWidth="1"
                />
              ))}
              <polygon points={tendencia.areaPts} fill="url(#fxTrend)" />
              <polyline
                points={tendencia.linePts}
                fill="none"
                stroke="var(--color-brand)"
                strokeWidth="2.5"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {tendencia.dots.map((p) => (
                <circle
                  key={`${p.cx}-${p.cy}`}
                  cx={p.cx}
                  cy={p.cy}
                  r="3.5"
                  fill="var(--color-surface)"
                  stroke="var(--color-brand)"
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>
        </div>
        <div className="ml-9 mt-2 flex justify-between">
          {tendencia.labels.map((d) => (
            <span key={d} className="tabular text-[10.5px] text-text-muted">
              {d}
            </span>
          ))}
        </div>
      </div>
    </Panel>
  )
}
