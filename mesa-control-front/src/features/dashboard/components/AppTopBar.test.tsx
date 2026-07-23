import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppTopBar } from './AppTopBar'
import { useAuthStore } from '../../../stores/auth.store'

function renderTopBar(path = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppTopBar />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({
    token: 'jwt-123',
    user: {
      id: 'u-1',
      email: 'op@fibex.com',
      name: 'Operador Uno',
      role: 'OPERADOR',
    },
  })
})

describe('AppTopBar', () => {
  it('el item Fibex Play enlaza a /fibex-play', () => {
    renderTopBar()
    const enlace = screen.getByRole('link', { name: 'Fibex Play' })
    expect(enlace).toHaveAttribute('href', '/fibex-play')
  })

  it('marca activo Fibex Play también en /fibex-play/gestion', () => {
    renderTopBar('/fibex-play/gestion')
    expect(screen.getByRole('link', { name: 'Fibex Play' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
