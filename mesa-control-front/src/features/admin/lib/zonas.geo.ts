/**
 * Coordenadas estáticas nombre→[lat,lng] de las parroquias de La Guaira.
 *
 * El back envía `count` por `nombre`; el front resuelve la posición del marcador
 * aquí. Las 6 primeras son las del diseño; las 4 restantes son aproximaciones
 * reales de las parroquias del estado La Guaira. Una zona sin coords se lista en
 * el overlay pero no dibuja marcador (`zonaCoords` devuelve `undefined`).
 */
export type LatLng = [number, number]

export const ZONA_COORDS: Record<string, LatLng> = {
  Caraballeda: [10.617, -66.852],
  Macuto: [10.606, -66.888],
  'La Guaira': [10.601, -66.931],
  Maiquetía: [10.596, -66.983],
  'Catia La Mar': [10.596, -67.028],
  Naiguatá: [10.621, -66.742],
  Carayaca: [10.552, -67.083],
  'El Junko': [10.489, -67.05],
  'La Sabana': [10.632, -66.386],
  Chuspa: [10.63, -66.309],
}

/** Centro y zoom iniciales del mapa (del diseño). */
export const MAP_CENTER: LatLng = [10.605, -66.9]
export const MAP_ZOOM = 12

export function zonaCoords(nombre: string): LatLng | undefined {
  return ZONA_COORDS[nombre]
}
