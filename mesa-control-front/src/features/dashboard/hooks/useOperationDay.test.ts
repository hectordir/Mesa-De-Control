import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  formatoCorto,
  formatoLargo,
  hoyISO,
  useOperationDay,
} from './useOperationDay'

describe('formatos de la fecha de operación', () => {
  it('formatea el día largo en español', () => {
    expect(formatoLargo('2026-07-17')).toBe('viernes 17 de julio de 2026')
  })

  it('formatea el día corto en español', () => {
    expect(formatoCorto('2026-07-17')).toBe('17 jul 2026')
  })

  it('hoyISO devuelve YYYY-MM-DD', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('useOperationDay', () => {
  it('arranca en hoy y "volver a hoy" restablece la fecha', () => {
    const { result } = renderHook(() => useOperationDay())
    const hoy = hoyISO()

    expect(result.current.fecha).toBe(hoy)
    expect(result.current.esHoy).toBe(true)

    act(() => result.current.setFecha('2026-07-17'))
    expect(result.current.fecha).toBe('2026-07-17')
    expect(result.current.corto).toBe('17 jul 2026')

    act(() => result.current.volverAHoy())
    expect(result.current.fecha).toBe(hoy)
    expect(result.current.esHoy).toBe(true)
  })
})
