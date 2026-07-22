import type { KpiResumen } from '../../../lib/api/types'
import { KpiCard, type KpiTono } from './KpiCard'
import type { EstadoPanel } from './PanelStates'

/** Metas operativas de la mesa (fijas mientras no vengan de configuración). */
const META_EFECTIVIDAD = 75
const META_NOC = 25
const META_PENDIENTE = 40

/** Sufijo `· +N` cuando el indicador supera su meta. */
function exceso(valor: number, meta: number, unidad = ''): string {
  const delta = valor - meta
  return delta > 0 ? ` · +${delta}${unidad}` : ''
}

interface Definicion {
  label: string
  valor: string
  meta: string
  metaVacia: string
  tono: KpiTono
}

const CERO: KpiResumen = {
  clientesAtendidos: 0,
  efectividadMesa: 0,
  enviadoSoporte2: 0,
  escaladoNoc: 0,
  pendienteCliente: 0,
}

function definiciones(k: KpiResumen): Definicion[] {
  return [
    {
      label: 'Clientes Atendidos',
      valor: `${k.clientesAtendidos}`,
      meta: 'total registrado',
      metaVacia: 'sin registro hoy',
      tono: 'brand',
    },
    {
      label: 'Efectividad Mesa',
      valor: `${k.efectividadMesa}%`,
      meta: `meta ${META_EFECTIVIDAD}%${exceso(k.efectividadMesa, META_EFECTIVIDAD, ' pts')}`,
      metaVacia: `meta ${META_EFECTIVIDAD}%`,
      tono: 'success',
    },
    {
      label: 'Enviado a Soporte 2',
      valor: `${k.enviadoSoporte2}`,
      meta: 'casos',
      metaVacia: '0 casos',
      tono: 'warning',
    },
    {
      label: 'Escalado a NOC',
      valor: `${k.escaladoNoc}`,
      meta: `meta ≤ ${META_NOC}${exceso(k.escaladoNoc, META_NOC)}`,
      metaVacia: `meta ≤ ${META_NOC}`,
      tono: 'danger',
    },
    {
      label: 'Pendiente Cliente',
      valor: `${k.pendienteCliente}`,
      meta: `meta ≤ ${META_PENDIENTE}${exceso(k.pendienteCliente, META_PENDIENTE)}`,
      metaVacia: `meta ≤ ${META_PENDIENTE}`,
      tono: 'info',
    },
  ]
}

export interface KpiRowProps {
  kpis?: KpiResumen
  estado: EstadoPanel
}

/** Rejilla de indicadores del día (auto-fit, mínimo 190 px). */
export function KpiRow({ kpis, estado }: KpiRowProps) {
  const vacio = estado === 'empty'
  const cargando = estado === 'loading'

  return (
    <section
      aria-label="Indicadores del día"
      aria-busy={cargando}
      className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-[14px]"
    >
      {definiciones(kpis ?? CERO).map((d) => (
        <KpiCard
          key={d.label}
          label={d.label}
          valor={d.valor}
          meta={vacio ? d.metaVacia : d.meta}
          tono={d.tono}
          cargando={cargando}
          vacio={vacio}
        />
      ))}
    </section>
  )
}
