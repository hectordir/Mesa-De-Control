import { beforeEach, describe, expect, it } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { AxiosError, AxiosHeaders } from 'axios'
import { api, API_BASE_URL, attachAuthToken, handleUnauthorized } from './client'
import { useAuthStore } from '../../stores/auth.store'

function configWith(headers: Record<string, string> = {}) {
  return {
    headers: {
      ...headers,
      set(name: string, value: string) {
        ;(this as Record<string, unknown>)[name] = value
      },
    },
  } as unknown as InternalAxiosRequestConfig
}

describe('cliente HTTP', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null })
  })

  it('toma la URL base de la variable de entorno de Vite (o el default)', () => {
    expect(API_BASE_URL).toBe(
      import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    )
    expect(api.defaults.baseURL).toBe(API_BASE_URL)
  })

  it('no añade Authorization si no hay sesión', () => {
    const config = attachAuthToken(configWith())
    expect(config.headers.Authorization).toBeUndefined()
  })

  it('añade Authorization: Bearer cuando hay token en el store', () => {
    useAuthStore.setState({ token: 'jwt-abc' })
    const config = attachAuthToken(configWith())
    expect(config.headers.Authorization).toBe('Bearer jwt-abc')
  })

  it('un 401 en una ruta protegida cierra la sesión', async () => {
    useAuthStore.setState({ token: 'caducado' })
    const error = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, null, {
      status: 401,
      statusText: '',
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders(), url: '/auth/me' },
    })
    await expect(handleUnauthorized(error)).rejects.toBe(error)
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('un 401 del propio login NO borra nada (aún no había sesión)', async () => {
    useAuthStore.setState({ token: 'previo' })
    const error = new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', undefined, null, {
      status: 401,
      statusText: '',
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders(), url: '/auth/login' },
    })
    await expect(handleUnauthorized(error)).rejects.toBe(error)
    expect(useAuthStore.getState().token).toBe('previo')
  })
})
