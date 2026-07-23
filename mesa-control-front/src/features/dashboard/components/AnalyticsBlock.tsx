import type { AnalisisMensualResponse } from '../../../lib/api/types'
import {
  buildAtendidos,
  buildDistribucion,
  buildOperadores,
  buildTendencia,
} from '../analisis-mensual.derive'
import { AttendedClientsPanel } from './AttendedClientsPanel'
import { AttentionTrendPanel } from './AttentionTrendPanel'
import { DailyBreakdownPanel } from './DailyBreakdownPanel'
import { type EstadoPanel } from './PanelStates'
import { RecurringFailuresPanel } from './RecurringFailuresPanel'
import { RequestDistributionPanel } from './RequestDistributionPanel'
import { SolutionVsN2Panel } from './SolutionVsN2Panel'
import { TopOperatorsPanel } from './TopOperatorsPanel'

export interface AnalyticsBlockProps {
  resumen: AnalisisMensualResponse
  estado: EstadoPanel
}

/**
 * Bloque analítico inferior: siete paneles derivados de la misma respuesta.
 * Nunca muestra error rojo; degrada a una tarjeta vacía o a esqueletos.
 */
export function AnalyticsBlock({ resumen, estado }: AnalyticsBlockProps) {
  if (estado === 'loading') {
    return (
      <div
        aria-busy="true"
        className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4"
      >
        {[0, 1].map((i) => (
          <div
            key={i}
            aria-hidden="true"
            className="h-[260px] rounded-card border border-border fx-skeleton"
          />
        ))}
      </div>
    )
  }

  if (estado === 'empty') {
    return (
      <section
        role="region"
        aria-label="Analítica no disponible"
        className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-card border border-border bg-surface p-8 text-center shadow-elevation"
      >
        <div
          aria-hidden="true"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-[11px] border-[1.5px] border-dashed border-border text-[20px] text-text-muted"
        >
          ◔
        </div>
        <p className="text-[14px] font-semibold text-text-primary">
          Analítica no disponible
        </p>
        <p className="max-w-[320px] text-caption leading-[1.5] text-text-muted">
          La distribución de solicitudes, el ranking de operadores y la tendencia
          diaria aparecerán cuando el mes tenga gestiones registradas.
        </p>
      </section>
    )
  }

  const distribucion = buildDistribucion(resumen.distribucion)
  const atendidos = buildAtendidos(resumen.distribucion)
  const operadores = buildOperadores(resumen.operadores)
  const tendencia = buildTendencia(resumen.tendencia)

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4">
        <RequestDistributionPanel
          segmentos={distribucion}
          total={resumen.kpis.volumen}
        />
        <AttendedClientsPanel atendidos={atendidos} />
      </div>

      <SolutionVsN2Panel barras={operadores.barras} ticks={operadores.ticks} />

      <div className="mt-[6px] flex items-center gap-[11px]">
        <span aria-hidden="true" className="h-[22px] w-1 rounded-[3px] bg-brand" />
        <h2 className="text-[18px] font-bold tracking-[-.01em] text-text-primary">
          Monitoreo de Flujo Diario
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <AttentionTrendPanel tendencia={tendencia} />
        <DailyBreakdownPanel filas={tendencia.filas} />
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] gap-4">
        <TopOperatorsPanel top={operadores.top} />
        <RecurringFailuresPanel segmentos={distribucion} />
      </div>
    </>
  )
}
