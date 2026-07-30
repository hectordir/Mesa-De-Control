import { describe, expect, it } from 'vitest'
import { parseISO, toISO } from './isoDate'

describe('isoDate', () => {
  it('parsea YYYY-MM-DD como fecha local, sin desfase de zona horaria', () => {
    const fecha = parseISO('2026-07-15')
    expect(fecha?.getFullYear()).toBe(2026)
    expect(fecha?.getMonth()).toBe(6)
    expect(fecha?.getDate()).toBe(15)
  })

  it('devuelve undefined si el valor no es una fecha ISO', () => {
    expect(parseISO('')).toBeUndefined()
    expect(parseISO('15/07/2026')).toBeUndefined()
  })

  it('serializa una fecha local a YYYY-MM-DD con ceros a la izquierda', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
