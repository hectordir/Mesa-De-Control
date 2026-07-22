import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  etiquetaMes,
  mesActualISO,
  useMonthFilter,
} from './useMonthFilter'

describe('etiquetaMes', () => {
  it('devuelve el mes en es-VE con inicial mayúscula', () => {
    expect(etiquetaMes('2026-05')).toBe('Mayo 2026')
    expect(etiquetaMes('2026-12')).toBe('Diciembre 2026')
  })
})

describe('useMonthFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 14))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('arranca en el mes en curso', () => {
    expect(mesActualISO()).toBe('2026-05')
    const { result } = renderHook(() => useMonthFilter())
    expect(result.current.periodo).toBe('2026-05')
    expect(result.current.etiqueta).toBe('Mayo 2026')
  })

  it('ofrece los últimos doce meses, del más reciente al más antiguo', () => {
    const { result } = renderHook(() => useMonthFilter())
    expect(result.current.opciones).toHaveLength(12)
    expect(result.current.opciones[0]).toEqual({
      value: '2026-05',
      label: 'Mayo 2026',
    })
    expect(result.current.opciones[11]).toEqual({
      value: '2025-06',
      label: 'Junio 2025',
    })
  })

  it('cambia el periodo seleccionado', () => {
    const { result } = renderHook(() => useMonthFilter())
    act(() => result.current.setPeriodo('2026-02'))
    expect(result.current.periodo).toBe('2026-02')
    expect(result.current.etiqueta).toBe('Febrero 2026')
  })
})
