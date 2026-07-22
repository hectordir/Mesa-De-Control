import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { UserMenu } from './UserMenu'
import { useAuthStore } from '../../../stores/auth.store'

function renderMenu() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<UserMenu />} />
        <Route path="/login" element={<h1>Acceso</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('UserMenu', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      token: 'jwt-123',
      user: {
        id: 'u-1',
        email: 'jhon@fibex.com',
        name: 'Jhon Rivas',
        role: 'OPERADOR',
      },
    })
  })

  it('muestra las iniciales del usuario autenticado', () => {
    renderMenu()
    expect(screen.getByText('JR')).toBeInTheDocument()
    expect(screen.getByLabelText(/Jhon Rivas/i)).toBeInTheDocument()
  })

  it('Salir limpia la sesión y navega a /login', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'Salir' }))

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(screen.getByRole('heading', { name: 'Acceso' })).toBeInTheDocument()
  })
})
