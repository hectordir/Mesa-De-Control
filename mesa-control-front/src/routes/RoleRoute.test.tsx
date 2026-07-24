import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { RoleRoute } from './RoleRoute'
import { useAuthStore } from '../stores/auth.store'
import type { Role } from '../lib/api/types'

function renderWithRole(role: Role) {
  useAuthStore.setState({
    token: 'jwt-123',
    user: { id: 'u-1', email: 'x@fibex.com', name: 'X', role },
  })
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['ADMIN', 'SUPERVISOR']}>
              <h1>Supervisión</h1>
            </RoleRoute>
          }
        />
        <Route path="/dashboard" element={<h1>Panel</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
})

describe('RoleRoute', () => {
  it('un rol permitido (ADMIN) renderiza el contenido', () => {
    renderWithRole('ADMIN')
    expect(screen.getByRole('heading', { name: 'Supervisión' })).toBeInTheDocument()
  })

  it('un rol permitido (SUPERVISOR) renderiza el contenido', () => {
    renderWithRole('SUPERVISOR')
    expect(screen.getByRole('heading', { name: 'Supervisión' })).toBeInTheDocument()
  })

  it('un rol sin acceso (OPERADOR) redirige fuera de la sección', () => {
    renderWithRole('OPERADOR')
    expect(screen.queryByRole('heading', { name: 'Supervisión' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument()
  })
})
