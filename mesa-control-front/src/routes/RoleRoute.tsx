import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import type { Role } from '../lib/api/types'

/**
 * Gatea una ruta por rol de sesión. Se monta DENTRO de `ProtectedRoute` (que ya
 * garantiza sesión activa); aquí solo se compara `user.role` contra los roles
 * permitidos. Si no aplica, devuelve a la home autenticada en vez de a `/login`.
 */
export function RoleRoute({
  roles,
  children,
}: {
  roles: Role[]
  children: ReactNode
}) {
  const user = useAuthStore((state) => state.user)
  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
