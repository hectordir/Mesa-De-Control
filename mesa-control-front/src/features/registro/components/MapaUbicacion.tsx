import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

/** Centro por defecto: La Guaira (Venezuela), acorde al dominio de la mesa. */
const CENTRO_DEFECTO: [number, number] = [10.6012, -66.9311]

/** Parsea 'lat, lng' → tupla, o `null` si el texto no es un par válido. */
function parseCoords(value: string): [number, number] | null {
  const partes = value.split(',').map((p) => Number(p.trim()))
  if (partes.length !== 2 || partes.some((n) => Number.isNaN(n))) return null
  return [partes[0], partes[1]]
}

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
}

/** Pin de marca sin depender de los assets de imagen de Leaflet. */
const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:var(--color-brand);transform:rotate(-45deg);border:2px solid var(--color-on-brand);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 18],
})

/** Observa `data-theme` en <html> para alternar los tiles claro/oscuro. */
function useDataTheme(): 'dark' | 'light' {
  const leer = (): 'dark' | 'light' =>
    document.documentElement.getAttribute('data-theme') === 'light'
      ? 'light'
      : 'dark'
  const [theme, setTheme] = useState(leer)
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(leer()))
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])
  return theme
}

function Tiles() {
  const theme = useDataTheme()
  const variante = theme === 'light' ? 'light_all' : 'dark_all'
  return (
    <TileLayer
      key={variante}
      attribution='&copy; <a href="https://carto.com/">CARTO</a> · &copy; OpenStreetMap'
      url={`https://{s}.basemaps.cartocdn.com/${variante}/{z}/{x}/{y}{r}.png`}
    />
  )
}

/** Recentra la vista cuando el pin cambia desde fuera (input o GPS). */
function Recentrar({ posicion }: { posicion: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(posicion, map.getZoom())
  }, [map, posicion])
  return null
}

function PinArrastrable({
  posicion,
  onChange,
}: {
  posicion: [number, number]
  onChange: (coords: string) => void
}) {
  const markerRef = useRef<L.Marker>(null)
  useMapEvents({
    click(e) {
      onChange(formatCoords(e.latlng.lat, e.latlng.lng))
    },
  })
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker) {
          const { lat, lng } = marker.getLatLng()
          onChange(formatCoords(lat, lng))
        }
      },
    }),
    [onChange],
  )
  return (
    <Marker
      draggable
      icon={pinIcon}
      position={posicion}
      ref={markerRef}
      eventHandlers={eventHandlers}
    />
  )
}

/** Mapa Leaflet tema-aware con marcador arrastrable; sincroniza coordenadas. */
export function MapaUbicacion({
  value,
  onChange,
}: {
  value: string
  onChange: (coords: string) => void
}) {
  const posicion = parseCoords(value) ?? CENTRO_DEFECTO
  return (
    <div className="h-64 w-full" data-testid="mapa-ubicacion">
      <MapContainer
        center={CENTRO_DEFECTO}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <Tiles />
        <Recentrar posicion={posicion} />
        <PinArrastrable posicion={posicion} onChange={onChange} />
      </MapContainer>
    </div>
  )
}
