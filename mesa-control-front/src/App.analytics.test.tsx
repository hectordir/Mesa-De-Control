import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Analytics } from '@vercel/analytics/react'
import App from './App'
import { useAuthStore } from './stores/auth.store'

/**
 * Vercel Web Analytics solo reporta desde el deploy; en jsdom se mockea el
 * módulo para verificar el MONTAJE sin inyectar el script ni tocar la red.
 */
vi.mock('@vercel/analytics/react', () => ({
  Analytics: vi.fn(() => null),
}))

describe('App + Vercel Web Analytics', () => {
  beforeEach(() => {
    vi.mocked(Analytics).mockClear()
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null })
    window.history.pushState({}, '', '/')
  })

  it('monta <Analytics /> una sola vez en la raíz de la app', async () => {
    render(<App />)

    await screen.findByRole('button', { name: /Acceder al sistema/i })
    expect(Analytics).toHaveBeenCalledTimes(1)
  })

  it('sigue renderizando el router con el analytics montado', async () => {
    render(<App />)

    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })
})
