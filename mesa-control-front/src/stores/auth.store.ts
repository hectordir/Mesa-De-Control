import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PublicUser } from '../lib/api/types'

/** Clave de `localStorage` acordada en el spec. */
export const AUTH_STORAGE_KEY = 'fibex.token'

export interface AuthState {
  token: string | null
  user: PublicUser | null
  login: (token: string, user: PublicUser) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      isAuthenticated: () => Boolean(get().token),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
