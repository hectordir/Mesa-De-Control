import { useState } from 'react'
import { AppTopBar } from '../dashboard/components/AppTopBar'
import { AdminHeader } from './components/AdminHeader'
import { BandejaNivel2 } from './components/BandejaNivel2'
import { Catalogos } from './components/Catalogos'
import { ConfiguracionMetas } from './components/ConfiguracionMetas'
import { DepuracionGestiones } from './components/DepuracionGestiones'
import { HeatMapDiario } from './components/HeatMapDiario'
import { ImportadorRelampago } from './components/ImportadorRelampago'
import { OrdenesSla } from './components/OrdenesSla'
import { ResumenOperativo } from './components/ResumenOperativo'
import { ZonasMapCard } from './components/ZonasMapCard'
import { useDeleteGestiones, useSupervision } from './hooks/useSupervision'
import { todayIso } from './lib/admin.presentation'

/** Admin · Supervisión: panel de auditoría de la mesa para responsables. */
export default function AdminPage() {
  // Fecha de auditoría anclada a HOY (el seed vive en el día en curso).
  const [fecha, setFecha] = useState(todayIso())
  const { data, isPending, isError } = useSupervision(fecha)
  const eliminar = useDeleteGestiones()

  return (
    <div className="tabular flex min-h-screen flex-col gap-5 bg-bg p-6 font-sans text-text-primary">
      <AppTopBar />
      <AdminHeader fecha={fecha} onFechaChange={setFecha} />

      {isPending ? (
        <div
          aria-busy="true"
          aria-label="Cargando supervisión"
          className="grid gap-4"
        >
          <div className="h-[380px] animate-pulse rounded-card bg-surface" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[140px] animate-pulse rounded-card bg-surface" />
            ))}
          </div>
        </div>
      ) : isError || !data ? (
        <div
          role="alert"
          className="rounded-card border border-border bg-surface p-8 text-center text-body text-text-secondary"
        >
          No se pudo cargar la Supervisión. Reintenta más tarde.
        </div>
      ) : (
        <>
          <ZonasMapCard zonas={data.zonas} />
          <ResumenOperativo kpis={data.kpis} fecha={data.fecha} />

          <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
            <BandejaNivel2 items={data.bandejaN2} />
            <OrdenesSla sla={data.sla} />
          </div>

          <ConfiguracionMetas />
          <Catalogos />
          <ImportadorRelampago />
          <HeatMapDiario heatmap={data.heatmap} fecha={data.fecha} />
          <DepuracionGestiones
            items={data.depuracion}
            isDeleting={eliminar.isPending}
            onEliminar={(ids) => eliminar.mutate(ids)}
          />
        </>
      )}
    </div>
  )
}
