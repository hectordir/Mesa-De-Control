import { useMemo, useState } from 'react'
import type { OperadorResumen } from '../../../lib/api/types'
import { RowsIcon } from './icons'
import { OperatorSearch } from './OperatorSearch'
import { OperatorsTable } from './OperatorsTable'
import {
  EmptyState,
  Panel,
  Skeleton,
  SkeletonRows,
  type EstadoPanel,
} from './PanelStates'

export interface OperatorsPanelProps {
  operadores: readonly OperadorResumen[]
  estado: EstadoPanel
}

export function OperatorsPanel({ operadores, estado }: OperatorsPanelProps) {
  const [filtro, setFiltro] = useState('')

  const visibles = useMemo(() => {
    const termino = filtro.trim().toLowerCase()
    if (!termino) return operadores
    return operadores.filter((o) => o.nombre.toLowerCase().includes(termino))
  }, [operadores, filtro])

  return (
    <Panel
      titulo="Resumen por operador"
      subtitulo="Productividad y distribución por persona"
      estado={estado}
      accion={<OperatorSearch value={filtro} onChange={setFiltro} />}
    >
      {/*
        Reporte de Telegram comentado: su uso está por decidir y no hay envío
        real detrás. Para reactivarlo, devolver este bloque al prop `pie` del
        Panel (y restaurar los imports de `Button` y `SendIcon`).

        pie={
          <div className="border-t border-border-subtle px-4 py-[14px]">
            <Button
              disabled
              className="w-full py-[11px] text-[13px] font-semibold"
              title="Disponible próximamente"
            >
              <SendIcon size={14} />
              Generar reporte Telegram
            </Button>
          </div>
        }
      */}

      {estado === 'data' ? <OperatorsTable operadores={visibles} /> : null}

      {estado === 'empty' ? (
        <EmptyState
          icono={<RowsIcon />}
          titulo="Aún no hay gestiones hoy"
          descripcion="Cuando el equipo registre atenciones, verás aquí el desglose por operador."
          minHeight="min-h-[280px]"
        />
      ) : null}

      {estado === 'loading' ? (
        <div className="flex min-h-[280px] flex-col gap-[14px] p-4">
          <SkeletonRows>
            {() => (
              <div className="flex items-center gap-3">
                <Skeleton className="h-[26px] w-[26px] flex-shrink-0 rounded-pill" />
                <Skeleton className="h-3 flex-1 rounded-chip" />
                <Skeleton className="h-3 w-9 rounded-chip" />
                <Skeleton className="h-3 w-9 rounded-chip" />
              </div>
            )}
          </SkeletonRows>
        </div>
      ) : null}
    </Panel>
  )
}
