import { useState } from 'react'
import type { ChartTick, OperadorBar } from '../analisis-mensual.derive'
import { N2_H, fmt } from '../analisis-mensual.derive'
import { iniciales } from '../derive'
import { Panel } from './PanelStates'

export interface SolutionVsN2PanelProps {
  barras: readonly OperadorBar[]
  ticks: readonly ChartTick[]
}

/** Máximo de operadores comparados a la vez en el diseño. */
const MAX_BARS = 6

/** Comparativa Solución vs Nivel 2 con detalle interactivo del operador. */
export function SolutionVsN2Panel({ barras, ticks }: SolutionVsN2PanelProps) {
  const visibles = barras.slice(0, MAX_BARS)
  const [sel, setSel] = useState<number | null>(null)
  const seleccionado = sel != null ? visibles[sel] : null
  const alternar = (i: number) => setSel((prev) => (prev === i ? null : i))

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4">
      <Panel
        titulo="Solución vs Nivel 2"
        subtitulo="Toca una barra para ver el detalle"
        estado="data"
        accion={
          <div className="flex items-center gap-4">
            <Leyenda color="bg-brand" texto="Solucionados" />
            <Leyenda color="bg-cat-3" texto="Enviados N2" />
          </div>
        }
      >
        <div className="px-5 pb-3 pt-5">
          <div className="flex gap-3">
            <div
              className="relative w-[26px] flex-shrink-0"
              style={{ height: `${N2_H}px` }}
            >
              {ticks.map((t) => (
                <span
                  key={t.value}
                  className="tabular absolute right-0 translate-y-1/2 text-[10.5px] text-text-muted"
                  style={{ bottom: `${t.bottom}px` }}
                >
                  {t.label}
                </span>
              ))}
            </div>
            <div
              className="relative min-w-0 flex-1"
              style={{ height: `${N2_H}px` }}
            >
              <div aria-hidden="true" className="absolute inset-0">
                {ticks.map((t) => (
                  <span
                    key={t.value}
                    className="absolute left-0 right-0 h-px bg-border-subtle"
                    style={{ bottom: `${t.bottom}px` }}
                  />
                ))}
              </div>
              <div className="absolute inset-0 flex items-end justify-between gap-3">
                {visibles.map((o, i) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-label={`Ver detalle de ${o.nombre}`}
                    aria-pressed={sel === i}
                    onClick={() => alternar(i)}
                    className="flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-end self-stretch transition-opacity"
                    style={{ opacity: sel != null && sel !== i ? 0.4 : 1 }}
                  >
                    <span className="flex w-full items-end justify-center gap-1">
                      <span
                        aria-hidden="true"
                        className="w-[42%] max-w-[20px] rounded-t-[4px] bg-brand"
                        style={{ height: `${o.solPx}px` }}
                      />
                      <span
                        aria-hidden="true"
                        className="w-[42%] max-w-[20px] rounded-t-[4px] bg-cat-3"
                        style={{ height: `${o.n2Px}px` }}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="ml-[38px] mt-2 flex gap-3">
            {visibles.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => alternar(i)}
                className="min-w-0 flex-1 cursor-pointer truncate rounded-[5px] px-0 py-[2px] text-center text-[11px] text-text-secondary"
                style={{
                  fontWeight: sel === i ? 700 : 500,
                  background:
                    sel === i
                      ? 'color-mix(in srgb, var(--color-brand) 16%, transparent)'
                      : 'transparent',
                }}
              >
                {o.nombre}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
        {seleccionado ? (
          <OperadorDetalle op={seleccionado} />
        ) : (
          <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <div
              aria-hidden="true"
              className="flex h-[46px] w-[46px] items-center justify-center rounded-[11px] border-[1.5px] border-dashed border-border text-[20px] text-text-muted"
            >
              ☞
            </div>
            <p className="max-w-[260px] text-[13px] italic leading-[1.5] text-text-muted">
              Selecciona un operador a la izquierda para inspeccionar
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <div className="flex items-center gap-[7px]">
      <span aria-hidden="true" className={`h-[11px] w-[11px] rounded-[3px] ${color}`} />
      <span className="text-caption text-text-secondary">{texto}</span>
    </div>
  )
}

function OperadorDetalle({ op }: { op: OperadorBar }) {
  return (
    <>
      <div className="flex items-center gap-[11px] border-b border-border-subtle p-4">
        <div
          className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[13px] font-bold text-brand"
          style={{ background: 'color-mix(in srgb, var(--color-brand) 20%, var(--color-surface))' }}
        >
          {iniciales(op.nombre)}
        </div>
        <div>
          <p className="text-[15px] font-bold text-text-primary">{op.nombre}</p>
          <p className="tabular text-caption text-text-muted">
            {fmt(op.total)} gestiones en total
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-3 gap-3">
          <Metrica valor={fmt(op.solucionados)} etiqueta="Solucionados" color="text-brand" />
          <Metrica valor={fmt(op.enviadosN2)} etiqueta="Enviados N2" color="text-cat-3" />
          <Metrica valor={`${op.tasa}%`} etiqueta="Tasa solución" color="text-success" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-label uppercase tracking-[.05em] text-text-muted">
            Proporción solucionado vs. escalado
          </p>
          <div className="flex h-[14px] overflow-hidden rounded-[7px] bg-bg">
            <span
              aria-hidden="true"
              className="bg-brand"
              style={{ width: `${op.tasa}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-text-muted">
            <span>Resuelto por el operador</span>
            <span>Derivado a Nivel 2</span>
          </div>
        </div>
      </div>
    </>
  )
}

function Metrica({
  valor,
  etiqueta,
  color,
}: {
  valor: string
  etiqueta: string
  color: string
}) {
  return (
    <div className="rounded-[11px] border border-border-subtle bg-bg p-[14px]">
      <p className={`tabular text-[26px] font-bold tracking-[-.02em] ${color}`}>
        {valor}
      </p>
      <p className="mt-[3px] text-[11px] text-text-muted">{etiqueta}</p>
    </div>
  )
}
