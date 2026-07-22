import { useState } from 'react'
import { filterZones, fmt, type Heatmap } from '../analisis-mensual.derive'
import { HeatmapCell } from './HeatmapCell'
import { HeatmapSearch } from './HeatmapSearch'
import { GridIcon } from './icons'
import { EmptyState, Panel, SkeletonRows, type EstadoPanel } from './PanelStates'

const TITULO = 'HeatMap Mensual de Incidencias'

/** Barra "menos → más" de la rampa de color. */
function HeatLegend() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-text-muted">menos</span>
      <span
        aria-hidden="true"
        className="h-[9px] w-[132px] rounded-[5px] border border-border-subtle"
        style={{
          background:
            'linear-gradient(90deg, var(--color-map-bg), color-mix(in srgb, var(--color-brand) 45%, var(--color-map-bg)), var(--color-brand))',
        }}
      />
      <span className="text-[11px] text-text-muted">más</span>
    </div>
  )
}

export interface IncidentHeatmapProps {
  heatmap: Heatmap
  estado: EstadoPanel
}

/** Mapa de calor zona × motivo, con cabecera y primera columna fijas. */
export function IncidentHeatmap({ heatmap, estado }: IncidentHeatmapProps) {
  const [query, setQuery] = useState('')
  const filas = filterZones(heatmap.rows, query)
  const consultando = query.trim().length > 0
  const totalZonas = heatmap.rows.length

  return (
    <Panel
      titulo={TITULO}
      subtitulo="Mapa de calor Mesa de Control · concentración de averías por zona y motivo"
      estado={estado}
      accion={
        <div className="flex flex-wrap items-center gap-[14px]">
          {estado === 'data' ? <HeatLegend /> : null}
          <HeatmapSearch value={query} onChange={setQuery} />
        </div>
      }
      pie={
        estado === 'data' ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-3 text-caption text-text-muted">
            <span>
              {consultando
                ? `${filas.length} de ${totalZonas} zonas`
                : `${totalZonas} zonas monitoreadas`}
            </span>
            <span>
              Total de incidencias del mes ·{' '}
              <span className="tabular font-bold text-text-secondary">
                {fmt(heatmap.grandTotal)}
              </span>
            </span>
          </div>
        ) : null
      }
    >
      {estado === 'data' ? (
        <div className="max-h-[472px] overflow-auto">
          <table
            aria-label={TITULO}
            className="w-full min-w-[820px] border-separate border-spacing-0 text-caption"
          >
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 border-b border-border border-r border-r-border-subtle bg-surface-elevated px-4 py-[11px] text-left text-label uppercase tracking-[.05em] text-text-secondary">
                  Zona
                </th>
                {heatmap.motivos.map((motivo) => (
                  <th
                    key={motivo}
                    className="sticky top-0 z-20 whitespace-nowrap border-b border-border bg-surface-elevated px-3 py-[11px] text-center text-label uppercase tracking-[.03em] text-text-muted"
                  >
                    {motivo}
                  </th>
                ))}
                <th className="sticky top-0 z-20 whitespace-nowrap border-b border-border border-l border-l-border-subtle bg-surface-elevated px-[14px] py-[11px] text-center text-label uppercase tracking-[.05em] text-text-secondary">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.zona}>
                  <td className="sticky left-0 z-10 whitespace-nowrap border-b border-border-subtle border-r border-r-border-subtle bg-surface px-4 py-[9px] font-semibold text-text-primary">
                    {fila.zona}
                  </td>
                  {fila.cells.map((celda, indice) => (
                    <HeatmapCell
                      key={heatmap.motivos[indice]}
                      v={celda.v}
                      t={celda.t}
                    />
                  ))}
                  <HeatmapCell v={fila.total} t={fila.totalT} esTotal />
                </tr>
              ))}
              {consultando && filas.length === 0 ? (
                <tr>
                  <td
                    colSpan={heatmap.motivos.length + 2}
                    className="p-7 text-center text-[13px] text-text-muted"
                  >
                    Ninguna zona coincide con “{query}”.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      {estado === 'empty' ? (
        <EmptyState
          icono={<GridIcon />}
          titulo="Sin incidencias en el mes seleccionado"
          descripcion="El mapa de calor se llenará conforme se registren averías por zona y motivo."
          minHeight="min-h-[320px]"
        />
      ) : null}

      {estado === 'loading' ? (
        <div className="flex min-h-[320px] flex-col gap-[10px] p-4 px-5">
          <SkeletonRows count={10}>
            {() => (
              <div className="flex items-center gap-[10px]">
                <span
                  aria-hidden="true"
                  className="block h-[13px] w-[120px] flex-shrink-0 rounded-chip fx-skeleton"
                />
                <span
                  aria-hidden="true"
                  className="block h-[13px] flex-1 rounded-chip fx-skeleton"
                />
              </div>
            )}
          </SkeletonRows>
        </div>
      ) : null}
    </Panel>
  )
}
