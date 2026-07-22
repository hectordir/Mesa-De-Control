import axios from 'axios'
import { api } from './client'
import type { LoginRequest, LoginResponse, PublicUser } from './types'

export type AuthErrorCode = 'credentials' | 'validation' | 'network'

/** Error de autenticación ya traducido a un mensaje mostrable al operador. */
export class AuthError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode, message: string) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

const NETWORK_MESSAGE = 'No se pudo conectar con el servidor'
const CREDENTIALS_MESSAGE = 'Credenciales inválidas'

function toAuthError(error: unknown): AuthError {
  if (!axios.isAxiosError(error)) return new AuthError('network', NETWORK_MESSAGE)

  const status = error.response?.status
  if (status === 401) return new AuthError('credentials', CREDENTIALS_MESSAGE)
  if (status === 400) {
    const message = (error.response?.data as { message?: string | string[] })
      ?.message
    return new AuthError(
      'validation',
      Array.isArray(message) ? message.join('. ') : (message ?? CREDENTIALS_MESSAGE),
    )
  }
  return new AuthError('network', NETWORK_MESSAGE)
}

/** Normaliza el correo igual que el backend antes de enviarlo. */
function normalize({ email, password }: LoginRequest): LoginRequest {
  return { email: email.trim().toLowerCase(), password }
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>(
      '/auth/login',
      normalize(credentials),
    )
    return data
  } catch (error) {
    throw toAuthError(error)
  }
}

export async function me(): Promise<PublicUser> {
  try {
    const { data } = await api.get<PublicUser>('/auth/me')
    return data
  } catch (error) {
    throw toAuthError(error)
  }
}
