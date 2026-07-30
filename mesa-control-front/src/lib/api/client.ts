import axios, { type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../stores/auth.store'

const DEFAULT_API_URL = 'http://localhost:3000'

/**
 * `VITE_API_URL` se inyecta en tiempo de BUILD. Una variable declarada pero
 * vacía (fácil de dejar así en el panel de Vercel) dejaría `baseURL = ''` y las
 * peticiones irían al dominio del front; por eso se recorta y se valida en vez
 * de usar solo `??`. La barra final se elimina para no depender de que el
 * cliente HTTP normalice `baseURL + url`.
 */
function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw ?? '').trim()
  if (!value) return DEFAULT_API_URL
  return value.replace(/\/+$/, '')
}

/** URL del API; siempre por entorno, nunca hardcodeada en los componentes. */
export const API_BASE_URL: string = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL,
)

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

/** Adjunta `Authorization: Bearer …` cuando hay sesión activa. */
export function attachAuthToken(
  config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
  const { token } = useAuthStore.getState()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
}

/**
 * Un 401 en una ruta protegida significa token caducado/malformado: se limpia
 * la sesión para que el guard devuelva al usuario a `/login`. El 401 del propio
 * login se deja pasar tal cual (lo traduce `lib/api/auth`).
 */
export function handleUnauthorized(error: unknown): Promise<never> {
  const response = axios.isAxiosError(error) ? error.response : undefined
  const url = response?.config?.url ?? ''
  if (response?.status === 401 && !url.endsWith('/auth/login')) {
    useAuthStore.getState().logout()
  }
  return Promise.reject(error)
}

api.interceptors.request.use(attachAuthToken)
api.interceptors.response.use((response) => response, handleUnauthorized)
