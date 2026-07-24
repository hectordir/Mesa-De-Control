import { describe, expect, it } from 'vitest'
import { MAP_CENTER, MAP_ZOOM, ZONA_COORDS, zonaCoords } from './zonas.geo'

describe('zonas.geo', () => {
  it('resuelve las coordenadas del diseño por nombre de zona', () => {
    expect(zonaCoords('Caraballeda')).toEqual([10.617, -66.852])
    expect(zonaCoords('Naiguatá')).toEqual([10.621, -66.742])
  })

  it('devuelve undefined para una zona sin coordenadas conocidas', () => {
    expect(zonaCoords('Zona Fantasma')).toBeUndefined()
  })

  it('centra el mapa sobre La Guaira', () => {
    expect(MAP_CENTER).toEqual([10.605, -66.9])
    expect(MAP_ZOOM).toBe(12)
  })

  it('cubre las 10 parroquias del diseño', () => {
    const zonas = [
      'Caraballeda',
      'Macuto',
      'La Guaira',
      'Maiquetía',
      'Catia La Mar',
      'Naiguatá',
      'Carayaca',
      'El Junko',
      'La Sabana',
      'Chuspa',
    ]
    for (const z of zonas) expect(ZONA_COORDS[z]).toBeDefined()
  })
})
