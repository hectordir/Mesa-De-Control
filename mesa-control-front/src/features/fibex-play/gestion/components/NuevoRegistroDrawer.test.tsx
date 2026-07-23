import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NuevoRegistroDrawer } from './NuevoRegistroDrawer'
import { crearAtencion } from '../../../../lib/api/fibex-play-gestion'
import { getOperadores } from '../../../../lib/api/operadores'
import type { GestionCatalogos } from '../../../../lib/api/types'
import { createTestQueryClient } from '../../../../test/renderWithProviders'

vi.mock('../../../../lib/api/fibex-play-gestion', () => ({
  crearAtencion: vi.fn(),
}))
vi.mock('../../../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))

const crearMock = vi.mocked(crearAtencion)
const operadoresMock = vi.mocked(getOperadores)

const CATALOGOS: GestionCatalogos = {
  canales: ['ESPN', 'HBO Max'],
  motivos: ['Sin señal', 'App no carga'],
  soluciones: ['Reinicio de ONU', 'Escalar a NOC'],
  estados: ['SOLUCIONADO', 'EN_PROCESO', 'ESCALADO'],
}

function renderDrawer(onClose = vi.fn()) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <NuevoRegistroDrawer open catalogos={CATALOGOS} onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

beforeEach(() => {
  vi.clearAllMocks()
  operadoresMock.mockResolvedValue([
    { id: 'u-1', nombre: 'Jhon Rivas' },
    { id: 'u-2', nombre: 'María Bastidas' },
  ])
  crearMock.mockResolvedValue({
    id: 'a-1',
    operador: 'Jhon Rivas',
    abonado: 'Cond. Los Robles',
    canal: 'ESPN',
    motivo: 'Sin señal',
    solucion: 'Reinicio de ONU',
    estado: 'SOLUCIONADO',
    creadoEn: '2026-07-22T14:12:00.000Z',
  })
})

describe('NuevoRegistroDrawer', () => {
  it('se muestra como dialog con el formulario', async () => {
    renderDrawer()
    const dialog = await screen.findByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: /Nuevo Registro/i }),
    ).toBeInTheDocument()
    // 10 canales del catálogo poblados
    expect(await screen.findByRole('option', { name: 'ESPN' })).toBeInTheDocument()
  })

  it('deshabilita Guardar mientras faltan campos requeridos', async () => {
    renderDrawer()
    await screen.findByRole('dialog')
    expect(
      screen.getByRole('button', { name: /Guardar Registro/i }),
    ).toBeDisabled()
  })

  it('al completar y guardar llama a la mutación con el payload y cierra', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDrawer()
    await screen.findByRole('dialog')
    await screen.findByRole('option', { name: 'Jhon Rivas' })

    await user.selectOptions(screen.getByLabelText(/Operador/i), 'u-1')
    await user.type(screen.getByLabelText(/Número de abonado/i), 'Cond. Los Robles')
    await user.selectOptions(screen.getByLabelText(/Canal/i), 'ESPN')
    await user.selectOptions(screen.getByLabelText(/Motivo/i), 'Sin señal')
    await user.selectOptions(
      screen.getByLabelText(/Solución aplicada/i),
      'Reinicio de ONU',
    )
    // Estado por defecto SOLUCIONADO

    const guardar = screen.getByRole('button', { name: /Guardar Registro/i })
    expect(guardar).toBeEnabled()
    await user.click(guardar)

    await waitFor(() =>
      expect(crearMock).toHaveBeenCalledWith({
        operadorId: 'u-1',
        abonado: 'Cond. Los Robles',
        canal: 'ESPN',
        motivo: 'Sin señal',
        solucion: 'Reinicio de ONU',
        estado: 'SOLUCIONADO',
      }),
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('cierra al pulsar Cancelar', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDrawer()
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
