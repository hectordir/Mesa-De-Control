import { beforeEach, describe, expect, it } from 'vitest'
import { AUTH_STORAGE_KEY, useAuthStore } from './auth.store'
import type { PublicUser } from '../lib/api/types'

const user: PublicUser = {
  id: 'u-1',
  email: 'operador@fibex.com',
  name: 'Operador',
  role: 'OPERADOR',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null })
  })

  it('arranca sin sesión', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated()).toBe(false)
  })

  it('login() guarda token y usuario y marca la sesión como activa', () => {
    useAuthStore.getState().login('jwt-123', user)
    const state = useAuthStore.getState()
    expect(state.token).toBe('jwt-123')
    expect(state.user).toEqual(user)
    expect(state.isAuthenticated()).toBe(true)
  })

  it('persiste la sesión en localStorage bajo la clave del proyecto', () => {
    useAuthStore.getState().login('jwt-123', user)
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    expect(raw).toBeTruthy()
    expect(raw).toContain('jwt-123')
    expect(AUTH_STORAGE_KEY).toBe('fibex.token')
  })

  it('logout() limpia token y usuario', () => {
    useAuthStore.getState().login('jwt-123', user)
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.user).toBeNull()
    expect(state.isAuthenticated()).toBe(false)
  })
})
