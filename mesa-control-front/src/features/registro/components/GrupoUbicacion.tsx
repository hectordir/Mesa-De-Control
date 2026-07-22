import { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import type { GrupoProps } from './GrupoDatos'
import { TextField } from './campos'
import { MapaUbicacion } from './MapaUbicacion'

/** Grupo 2: pin de ubicación, captura GPS y mapa Leaflet tema-aware. */
export function GrupoUbicacion({ values, setField }: GrupoProps) {
  const [gpsError, setGpsError] = useState<string | null>(null)

  function capturarGps() {
    setGpsError(null)
    if (!navigator.geolocation) {
      setGpsError('Este navegador no permite obtener la ubicación.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setField(
          'coordenadas',
          `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
        )
      },
      () => {
        setGpsError('No se pudo obtener el GPS; ubica el pin manualmente.')
      },
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-6 shadow-elevation">
      <h2 className="text-h3 font-semibold text-text-primary">Ubicación</h2>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <TextField
            label="Coordenadas del Pin"
            value={values.coordenadas}
            placeholder="10.6012, -66.9311"
            onChange={(v) => setField('coordenadas', v)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={capturarGps}>
          Capturar GPS
        </Button>
      </div>
      {gpsError ? (
        <p role="status" className="text-caption text-warning">
          {gpsError}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-card border border-border">
        <MapaUbicacion
          value={values.coordenadas}
          onChange={(v) => setField('coordenadas', v)}
        />
      </div>
    </section>
  )
}
