import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { useAuthStore } from './stores/auth.store'

describe('App', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null })
    window.history.pushState({}, '', '/')
  })

  it('sin sesión monta la pantalla de acceso', async () => {
    render(<App />)
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('con sesión monta el dashboard', async () => {
    useAuthStore.setState({
      token: 'jwt-123',
      user: {
        id: 'u-1',
        email: 'operador@fibex.com',
        name: 'Operador',
        role: 'OPERADOR',
      },
    })
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Mesa de Control', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
