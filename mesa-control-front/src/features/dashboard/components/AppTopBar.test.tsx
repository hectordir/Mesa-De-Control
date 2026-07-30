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
  it('no renderiza el grupo de tabs de empresa', () => {
    renderTopBar()
    expect(screen.queryByRole('tablist', { name: 'Empresa' })).not.toBeInTheDocument()
    for (const empresa of ['Mesa de Control', 'Fibex Telecom', 'Soporte-NOC']) {
      expect(screen.queryByRole('tab', { name: empresa })).not.toBeInTheDocument()
      expect(screen.queryByText(empresa)).not.toBeInTheDocument()
    }
  })

  it('mantiene marca, navegación y cluster de sesión a la derecha', () => {
    renderTopBar()
    expect(screen.getByText('Fibex Control')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Secciones' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
  })

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

  it('oculta el ítem Admin a un rol OPERADOR', () => {
    renderTopBar()
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('muestra el ítem Admin (→ /admin) a un rol ADMIN', () => {
    useAuthStore.setState({
      token: 'jwt-123',
      user: { id: 'u-2', email: 'admin@fibex.com', name: 'Admin', role: 'ADMIN' },
    })
    renderTopBar()
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute(
      'href',
      '/admin',
    )
  })

  it('muestra el ítem Admin a un rol SUPERVISOR', () => {
    useAuthStore.setState({
      token: 'jwt-123',
      user: { id: 'u-3', email: 'sup@fibex.com', name: 'Sup', role: 'SUPERVISOR' },
    })
    renderTopBar()
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
  })
})
