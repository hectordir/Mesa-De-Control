import { beforeEach, describe, expect, it } from 'vitest'
import { useDashboardDateStore } from './dashboardDate.store'
import { hoyISO } from '../features/dashboard/hooks/useOperationDay'

describe('useDashboardDateStore', () => {
  beforeEach(() => {
    useDashboardDateStore.setState({ fecha: hoyISO() })
  })

  it('arranca en la fecha de hoy', () => {
    expect(useDashboardDateStore.getState().fecha).toBe(hoyISO())
  })

  it('setFecha guarda el día elegido', () => {
    useDashboardDateStore.getState().setFecha('2026-05-22')
    expect(useDashboardDateStore.getState().fecha).toBe('2026-05-22')
  })

  it('la fecha es el único estado: el periodo se deriva de ella', () => {
    useDashboardDateStore.getState().setFecha('2026-05-22')
    const { fecha, ...resto } = useDashboardDateStore.getState()
    expect(fecha.slice(0, 7)).toBe('2026-05')
    expect(Object.keys(resto)).toEqual(['setFecha'])
  })

  it('no persiste en localStorage: al recargar vuelve a hoy', () => {
    localStorage.clear()
    useDashboardDateStore.getState().setFecha('2026-05-22')
    expect(localStorage.length).toBe(0)
  })
})
