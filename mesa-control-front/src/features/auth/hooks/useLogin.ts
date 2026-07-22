import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AuthError, login } from '../../../lib/api/auth'
import type { LoginRequest, LoginResponse } from '../../../lib/api/types'
import { useAuthStore } from '../../../stores/auth.store'

/**
 * Mutación de acceso: persiste la sesión y navega al dashboard.
 * React Query se encarga de `isPending`, que bloquea el doble submit.
 */
export function useLogin() {
  const navigate = useNavigate()
  const signIn = useAuthStore((state) => state.login)

  return useMutation<LoginResponse, AuthError, LoginRequest>({
    // Envuelto a propósito: React Query v5 pasa un 2º argumento de contexto.
    mutationFn: (credentials) => login(credentials),
    onSuccess: ({ accessToken, user }) => {
      signIn(accessToken, user)
      navigate('/dashboard', { replace: true })
    },
  })
}
