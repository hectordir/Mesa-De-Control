/** Contratos compartidos con `mesa-control-back` (ver spec `acceso-login-jwt`). */

export type Role = 'OPERADOR' | 'SUPERVISOR' | 'ADMIN'

export interface PublicUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: PublicUser
}
