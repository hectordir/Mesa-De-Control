import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  etiquetaMes,
  mesActualISO,
  useMonthFilter,
} from './useMonthFilter'
import { hoyISO, useOperationDay } from './useOperationDay'
import { useDashboardDateStore } from '../../../stores/dashboardDate.store'

describe('etiquetaMes', () => {
  it('devuelve el mes en es-VE con inicial mayúscula', () => {
    expect(etiquetaMes('2026-05')).toBe('Mayo 2026')
    expect(etiquetaMes('2026-12')).toBe('Diciembre 2026')
  })
})

describe('mesActualISO · mes de la operación en Venezuela', () => {
  const TZ_ORIGINAL = process.env.TZ

  beforeEach(() => {
    // Navegador en UTC: a las 02:00 Z del 1 de agosto en Caracas es 31 de julio.
    process.env.TZ = 'UTC'
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T02:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = TZ_ORIGINAL
  })

  it('no adelanta el mes para un navegador al este de Caracas', () => {
    expect(new Date().getMonth()).toBe(7) // guarda: el host sí está en UTC (agosto)
    expect(mesActualISO()).toBe('2026-07')
  })

  it('la lista de meses arranca en el mes venezolano en curso', () => {
    useDashboardDateStore.setState({ fecha: '2026-07-01' })
    const { result } = renderHook(() => useMonthFilter())

    expect(result.current.opciones[0].value).toBe('2026-07')
    expect(result.current.opciones).toHaveLength(12)
  })
})

describe('useMonthFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 14))
    // El store es global y sobrevive entre tests: se restablece con el reloj
    // ya congelado para que "hoy" sea determinista.
    useDashboardDateStore.setState({ fecha: hoyISO() })
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

  it('marca esMesActual según el periodo seleccionado', () => {
    const { result } = renderHook(() => useMonthFilter())
    expect(result.current.esMesActual).toBe(true)

    act(() => result.current.setPeriodo('2026-02'))
    expect(result.current.esMesActual).toBe(false)
  })

  it('volverAlMesActual restablece el periodo al mes en curso', () => {
    const { result } = renderHook(() => useMonthFilter())
    act(() => result.current.setPeriodo('2026-02'))

    act(() => result.current.volverAlMesActual())

    expect(result.current.periodo).toBe('2026-05')
    expect(result.current.etiqueta).toBe('Mayo 2026')
    expect(result.current.esMesActual).toBe(true)
  })

  it('deriva el periodo de la fecha del store compartido', () => {
    useDashboardDateStore.setState({ fecha: '2026-02-22' })
    const { result } = renderHook(() => useMonthFilter())

    expect(result.current.periodo).toBe('2026-02')
    expect(result.current.etiqueta).toBe('Febrero 2026')
  })

  it('elegir un mes fija el día 1 de ese mes en el store', () => {
    const { result } = renderHook(() => useMonthFilter())

    act(() => result.current.setPeriodo('2026-02'))

    expect(useDashboardDateStore.getState().fecha).toBe('2026-02-01')
  })

  it('volverAlMesActual fija el día 1 del mes en curso (esHoy deja de serlo)', () => {
    const { result } = renderHook(() => ({
      mes: useMonthFilter(),
      dia: useOperationDay(),
    }))
    act(() => result.current.mes.setPeriodo('2026-02'))

    act(() => result.current.mes.volverAlMesActual())

    expect(useDashboardDateStore.getState().fecha).toBe('2026-05-01')
    expect(result.current.mes.esMesActual).toBe(true)
    expect(result.current.dia.esHoy).toBe(false)
  })

  it('añade el mes seleccionado cuando cae fuera de los últimos doce', () => {
    // El calendario diario admite cualquier día pasado: si el mes derivado no
    // está en la lista, el `<select>` mostraría un mes que no es el real.
    useDashboardDateStore.setState({ fecha: '2024-03-22' })
    const { result } = renderHook(() => useMonthFilter())

    expect(result.current.periodo).toBe('2024-03')
    expect(result.current.opciones).toHaveLength(13)
    expect(result.current.opciones.map((o) => o.value)).toContain('2024-03')
    // se coloca en orden descendente: el más antiguo, al final
    expect(result.current.opciones.at(-1)).toEqual({
      value: '2024-03',
      label: 'Marzo 2024',
    })
    expect(result.current.opciones[0].value).toBe('2026-05')
  })

  it('no duplica el mes cuando ya está entre las doce opciones', () => {
    useDashboardDateStore.setState({ fecha: '2026-02-22' })
    const { result } = renderHook(() => useMonthFilter())

    expect(result.current.opciones).toHaveLength(12)
    expect(
      result.current.opciones.filter((o) => o.value === '2026-02'),
    ).toHaveLength(1)
  })
})
