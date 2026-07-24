import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Catalogos } from './Catalogos'
import { getOperadores } from '../../../lib/api/operadores'
import { createTestQueryClient } from '../../../test/renderWithProviders'

vi.mock('../../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))
const operadoresMock = vi.mocked(getOperadores)

function renderCatalogos() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <Catalogos />
    </QueryClientProvider>,
  )
}

/** Localiza la tarjeta de catálogo por su título. */
function cardOf(titulo: string): HTMLElement {
  return screen.getByText(titulo).closest('section, div[class*="rounded-card"]') as HTMLElement
}

beforeEach(() => {
  vi.clearAllMocks()
  document.documentElement.setAttribute('data-theme', 'dark')
})

describe('Catálogo de Operadores (UI-local seeded del back)', () => {
  it('lista los operadores del back en orden alfabético', async () => {
    operadoresMock.mockResolvedValue([
      { id: 'op-2', nombre: 'Zoraida' },
      { id: 'op-1', nombre: 'Andrea Pérez' },
    ])
    renderCatalogos()

    expect(await screen.findByText('Andrea Pérez')).toBeInTheDocument()
    expect(screen.getByText('Zoraida')).toBeInTheDocument()
  })

  it('ofrece un input para añadir y al agregar aparece el nuevo operador', async () => {
    operadoresMock.mockResolvedValue([{ id: 'op-1', nombre: 'Andrea Pérez' }])
    renderCatalogos()

    await screen.findByText('Andrea Pérez')
    const card = cardOf('Operadores')
    const input = within(card).getByLabelText(/Añadir a Operadores/i)
    await userEvent.type(input, 'Nuevo Operador{Enter}')

    expect(within(card).getByText('Nuevo Operador')).toBeInTheDocument()
  })
})
