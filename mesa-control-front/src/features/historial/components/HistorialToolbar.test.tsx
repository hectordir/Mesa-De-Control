import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HistorialToolbar } from './HistorialToolbar'

function setup() {
  render(
    <HistorialToolbar
      search=""
      onSearchChange={vi.fn()}
      desde=""
      hasta=""
      onDesdeChange={vi.fn()}
      onHastaChange={vi.fn()}
      onExport={vi.fn()}
    />,
  )
}

describe('HistorialToolbar', () => {
  it('el buscador anuncia que también busca por cliente (el back filtra nombreCliente)', () => {
    setup()
    expect(screen.getByRole('searchbox', { name: 'Buscar gestiones' })).toHaveAttribute(
      'placeholder',
      'Buscar por abonado, cliente, operador o teléfono',
    )
  })
})
