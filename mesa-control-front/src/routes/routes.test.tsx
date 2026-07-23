import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { routes } from './routes'
import { useAuthStore } from '../stores/auth.store'
import { createTestQueryClient } from '../test/renderWithProviders'

// Esta suite solo verifica el MONTAJE (y la protección) de cada ruta, no sus
// datos. Stubeamos el cliente HTTP para que ninguna petición real quede en
// vuelo: un 401 tardío de un back en marcha dispararía el logout del
// interceptor y sacaría al usuario de la vista bajo prueba, contaminando el
// test siguiente. Las páginas degradan a su estado de carga/vacío.
vi.mock('../lib/api/client', () => ({
  API_BASE_URL: 'http://test.local',
  api: {
    get: vi.fn(() => new Promise(() => {})),
    post: vi.fn(() => new Promise(() => {})),
  },
}))

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

  it('/dashboard/analisis-mensual muestra el análisis mensual con sesión', async () => {
    useAuthStore.setState(session)
    renderAt('/dashboard/analisis-mensual')
    expect(
      await screen.findByRole('heading', { name: 'Análisis Mensual', level: 1 }),
    ).toBeInTheDocument()
  })

  it('/dashboard/analisis-mensual sin sesión vuelve a la pantalla de acceso', async () => {
    renderAt('/dashboard/analisis-mensual')
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('/historial monta el Historial General con sesión', async () => {
    useAuthStore.setState(session)
    renderAt('/historial')
    expect(
      await screen.findByRole('heading', { name: 'Historial General', level: 1 }),
    ).toBeInTheDocument()
  })

  it('/historial sin sesión vuelve a la pantalla de acceso', async () => {
    renderAt('/historial')
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('/fibex-play monta la grilla en vivo con sesión', async () => {
    useAuthStore.setState(session)
    renderAt('/fibex-play')
    expect(
      await screen.findByRole('heading', { name: 'Fibex Play', level: 1 }),
    ).toBeInTheDocument()
  })

  it('/fibex-play sin sesión vuelve a la pantalla de acceso', async () => {
    renderAt('/fibex-play')
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('/fibex-play/gestion monta la gestión de clientes con sesión', async () => {
    useAuthStore.setState(session)
    renderAt('/fibex-play/gestion')
    expect(
      await screen.findByRole('heading', {
        name: 'Fibex Play — Gestión de Clientes',
        level: 1,
      }),
    ).toBeInTheDocument()
  })

  it('/fibex-play/gestion sin sesión vuelve a la pantalla de acceso', async () => {
    renderAt('/fibex-play/gestion')
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
