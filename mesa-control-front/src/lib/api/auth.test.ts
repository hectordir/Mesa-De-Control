import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { api } from './client'
import { AuthError, login, me } from './auth'
import type { LoginResponse } from './types'

const response: LoginResponse = {
  accessToken: 'jwt-123',
  user: {
    id: 'u-1',
    email: 'operador@fibex.com',
    name: 'Operador',
    role: 'OPERADOR',
  },
}

function axiosErrorWithStatus(status: number) {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
    status,
    statusText: '',
    data: { statusCode: status, message: 'Credenciales inválidas' },
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('API de autenticación', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('login() hace POST /auth/login y devuelve la respuesta tipada', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: response })
    await expect(
      login({ email: 'operador@fibex.com', password: 'secret123' }),
    ).resolves.toEqual(response)
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'operador@fibex.com',
      password: 'secret123',
    })
  })

  it('normaliza el email a minúsculas y sin espacios', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: response })
    await login({ email: '  Operador@Fibex.com ', password: 'secret123' })
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'operador@fibex.com',
      password: 'secret123',
    })
  })

  it('401 se traduce a AuthError de credenciales', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(axiosErrorWithStatus(401))
    const error = await login({
      email: 'operador@fibex.com',
      password: 'secret123',
    }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AuthError)
    expect((error as AuthError).code).toBe('credentials')
    expect((error as AuthError).message).toBe('Credenciales inválidas')
  })

  it('5xx se traduce a AuthError de red', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(axiosErrorWithStatus(500))
    const error = await login({
      email: 'operador@fibex.com',
      password: 'secret123',
    }).catch((e: unknown) => e)
    expect((error as AuthError).code).toBe('network')
    expect((error as AuthError).message).toBe(
      'No se pudo conectar con el servidor',
    )
  })

  it('error de red sin respuesta se traduce a AuthError de red', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(
      new AxiosError('Network Error', 'ERR_NETWORK'),
    )
    const error = await login({
      email: 'operador@fibex.com',
      password: 'secret123',
    }).catch((e: unknown) => e)
    expect((error as AuthError).code).toBe('network')
  })

  it('me() hace GET /auth/me', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: response.user })
    await expect(me()).resolves.toEqual(response.user)
    expect(get).toHaveBeenCalledWith('/auth/me')
  })
})
