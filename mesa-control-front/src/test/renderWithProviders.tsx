import type { ReactElement, ReactNode } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function withQuery(ui: ReactNode): ReactElement {
  return (
    <QueryClientProvider client={createTestQueryClient()}>
      {ui}
    </QueryClientProvider>
  )
}

/**
 * Renderiza `ui` en `/login` junto a un stub de `/dashboard`, para poder
 * afirmar sobre la navegación sin arrastrar la app completa.
 */
export function renderAtLogin(ui: ReactNode): RenderResult {
  return render(
    withQuery(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={ui} />
          <Route path="/dashboard" element={<h1>Panel de control</h1>} />
        </Routes>
      </MemoryRouter>,
    ),
  )
}
