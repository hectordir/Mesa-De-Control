import { describe, expect, it } from 'vitest'
import { RESULTADO_OPCIONES, ZONA_OPCIONES, conValorActual } from './opciones'

/** Enum `ResultadoGestion` del back (`lib/api/types.ts`). */
const RESULTADOS_DEL_BACK = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
] as const

describe('RESULTADO_OPCIONES', () => {
  it('cubre todos los valores del enum del back', () => {
    expect(RESULTADO_OPCIONES.map((o) => o.value).sort()).toEqual(
      [...RESULTADOS_DEL_BACK].sort(),
    )
  })

  it('etiqueta REAGENDADO como "Reagendado"', () => {
    expect(RESULTADO_OPCIONES).toContainEqual({
      label: 'Reagendado',
      value: 'REAGENDADO',
    })
  })
})

describe('conValorActual', () => {
  it('devuelve las opciones tal cual si el valor ya está', () => {
    expect(conValorActual(ZONA_OPCIONES, 'Macuto')).toBe(ZONA_OPCIONES)
  })

  it('devuelve las opciones tal cual si el valor está vacío', () => {
    expect(conValorActual(ZONA_OPCIONES, '')).toBe(ZONA_OPCIONES)
  })

  it('inyecta el valor legado como primera opción cuando no está en el catálogo', () => {
    const opciones = conValorActual(ZONA_OPCIONES, 'Zona Fantasma')

    expect(opciones[0]).toEqual({ label: 'Zona Fantasma', value: 'Zona Fantasma' })
    expect(opciones).toHaveLength(ZONA_OPCIONES.length + 1)
  })
})
