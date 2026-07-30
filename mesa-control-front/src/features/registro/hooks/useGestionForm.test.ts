import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hoy, useGestionForm } from './useGestionForm'

describe('useGestionForm', () => {
  it('sin iniciales arranca en los valores de creación', () => {
    const { result } = renderHook(() => useGestionForm())

    expect(result.current.values.fecha).toBe(hoy())
    expect(result.current.values.abonado).toBe('')
    expect(result.current.values.resultado).toBe('SOLUCIONADO_MESA')
    expect(result.current.values.tipo).toBe('Mesa')
  })

  it('sin iniciales, reset limpia pero conserva fecha y operador (registro)', () => {
    const { result } = renderHook(() => useGestionForm())

    act(() => {
      result.current.setField('operadorId', 'u-9')
      result.current.setField('fecha', '2026-01-05')
      result.current.setField('abonado', '100245')
    })
    act(() => result.current.reset())

    expect(result.current.values.abonado).toBe('')
    expect(result.current.values.operadorId).toBe('u-9')
    expect(result.current.values.fecha).toBe('2026-01-05')
  })

  it('acepta valores iniciales inyectados', () => {
    const { result } = renderHook(() =>
      useGestionForm({ abonado: '100245', zona: 'Macuto', requiereVisita: true }),
    )

    expect(result.current.values.abonado).toBe('100245')
    expect(result.current.values.zona).toBe('Macuto')
    expect(result.current.values.requiereVisita).toBe(true)
  })

  it('con iniciales, reset vuelve a esos iniciales y no al hardcode de creación', () => {
    const { result } = renderHook(() =>
      useGestionForm({ abonado: '100245', operadorId: 'u-3', fecha: '2026-02-10' }),
    )

    act(() => {
      result.current.setField('abonado', 'otro')
      result.current.setField('fecha', '2026-03-01')
    })
    act(() => result.current.reset())

    expect(result.current.values.abonado).toBe('100245')
    expect(result.current.values.operadorId).toBe('u-3')
    expect(result.current.values.fecha).toBe('2026-02-10')
  })

  it('la observación vacía no bloquea el submit', () => {
    const { result } = renderHook(() =>
      useGestionForm({
        operadorId: 'u-1',
        abonado: '1002451',
        nombreCliente: 'María Pérez',
        telefono: '0412-118-4420',
        detalle: 'Sin Internet',
        solucion: 'Reinicio de ONU',
        zona: 'Macuto',
        motivo: 'Corte de fibra',
        observacion: '',
      }),
    )

    let ok = false
    act(() => {
      ok = result.current.validate()
    })

    expect(ok).toBe(true)
    expect(result.current.errors.observacion).toBeUndefined()
  })

  it('los demás obligatorios se siguen validando', () => {
    const { result } = renderHook(() => useGestionForm({ observacion: '' }))

    act(() => result.current.validate())

    for (const campo of [
      'abonado',
      'nombreCliente',
      'telefono',
      'detalle',
      'solucion',
      'zona',
      'motivo',
    ] as const) {
      expect(result.current.errors[campo]).toBe('Este campo es obligatorio')
    }
  })

  it('valida los obligatorios sobre los valores inyectados', () => {
    const { result } = renderHook(() => useGestionForm({ abonado: '   ' }))

    let ok = true
    act(() => {
      ok = result.current.validate()
    })

    expect(ok).toBe(false)
    expect(result.current.errors.abonado).toBe('Este campo es obligatorio')
  })
})

describe('hoy · fecha por defecto del formulario', () => {
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

  it('propone el día de la operación en Venezuela, no el del navegador', () => {
    expect(new Date().getDate()).toBe(18) // guarda: el host sí está en UTC
    expect(hoy()).toBe('2026-07-17')

    const { result } = renderHook(() => useGestionForm())
    expect(result.current.values.fecha).toBe('2026-07-17')
  })
})
