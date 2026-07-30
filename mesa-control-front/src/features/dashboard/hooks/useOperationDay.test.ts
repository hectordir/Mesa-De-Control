import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatoCorto,
  formatoLargo,
  hoyISO,
  useOperationDay,
} from './useOperationDay'
import { useMonthFilter } from './useMonthFilter'
import { useDashboardDateStore } from '../../../stores/dashboardDate.store'

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

describe('hoyISO · día de la operación en Venezuela', () => {
  const TZ_ORIGINAL = process.env.TZ

  beforeEach(() => {
    // Navegador en UTC: a las 02:00 Z todavía es el día anterior en Caracas.
    process.env.TZ = 'UTC'
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-18T02:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = TZ_ORIGINAL
  })

  it('no adelanta el día para un navegador al este de Caracas', () => {
    expect(new Date().getDate()).toBe(18) // guarda: el host sí está en UTC
    expect(hoyISO()).toBe('2026-07-17')
  })
})

describe('useOperationDay', () => {
  // El store es global y sobrevive entre tests: se restablece siempre.
  beforeEach(() => {
    useDashboardDateStore.setState({ fecha: hoyISO() })
  })

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

  it('lee la fecha del store compartido del dashboard', () => {
    useDashboardDateStore.setState({ fecha: '2026-05-22' })
    const { result } = renderHook(() => useOperationDay())

    expect(result.current.fecha).toBe('2026-05-22')
    expect(result.current.largo).toBe('viernes 22 de mayo de 2026')
    expect(result.current.esHoy).toBe(false)
  })

  it('setFecha escribe en el store y el filtro mensual lo refleja', () => {
    const { result } = renderHook(() => ({
      dia: useOperationDay(),
      mes: useMonthFilter(),
    }))

    act(() => result.current.dia.setFecha('2026-05-22'))

    expect(useDashboardDateStore.getState().fecha).toBe('2026-05-22')
    expect(result.current.mes.periodo).toBe('2026-05')
    expect(result.current.mes.etiqueta).toBe('Mayo 2026')
  })
})
