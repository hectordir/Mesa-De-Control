import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'

/** Raíz de la app: al dashboard si hay sesión, al acceso si no. */
export function RootRedirect() {
  const token = useAuthStore((state) => state.token)
  return <Navigate to={token ? '/dashboard' : '/login'} replace />
}
