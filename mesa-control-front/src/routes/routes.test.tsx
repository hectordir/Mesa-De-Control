import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { routes } from './routes'
import { useAuthStore } from '../stores/auth.store'
import { createTestQueryClient } from '../test/renderWithProviders'

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

const session = {
  token: 'jwt-123',
  user: {
    id: 'u-1',
    email: 'operador@fibex.com',
    name: 'Operador',
    role: 'OPERADOR' as const,
  },
}

describe('rutas de la SPA', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null })
  })

  it('/login renderiza la pantalla de acceso', async () => {
    renderAt('/login')
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('/ redirige a /login cuando no hay sesión', async () => {
    renderAt('/')
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('/ redirige a /dashboard cuando hay sesión', async () => {
    useAuthStore.setState(session)
    renderAt('/')
    expect(
      await screen.findByRole('heading', { name: 'Monitor Diario', level: 1 }),
    ).toBeInTheDocument()
  })

  it('/dashboard sin sesión vuelve a la pantalla de acceso', async () => {
    renderAt('/dashboard')
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('una ruta desconocida cae en la pantalla de acceso', async () => {
    renderAt('/no-existe')
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })
})
