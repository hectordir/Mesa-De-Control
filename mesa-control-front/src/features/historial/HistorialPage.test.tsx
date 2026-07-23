import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HistorialPage from './HistorialPage'
import { fetchHistorial } from '../../lib/api/historial'
import type { GestionRow, HistorialResponse } from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

vi.mock('../../lib/api/historial', () => ({
  fetchHistorial: vi.fn(),
}))

const fetchMock = vi.mocked(fetchHistorial)

const fila = (over: Partial<GestionRow> = {}): GestionRow => ({
  id: 'clx1',
  codigo: 'GST-40921',
  operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
  abonado: 'Cond. Los Robles',
  telefono: '0412-118-4420',
  zona: 'Norte',
  canal: 'TELEGRAM',
  resultado: 'ESCALADO_NOC',
  fecha: '2026-07-17',
  hora: '10:42',
  duracionMin: 134,
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  ...over,
})

const CON_DATOS: HistorialResponse = {
  items: [fila(), fila({ id: 'clx2', codigo: 'GST-40922', abonado: 'Res. El Sol' })],
  total: 2,
  page: 1,
  pageSize: 10,
  counts: {
    total: 2,
    porResultado: { ESCALADO_NOC: 2, SOLUCIONADO_MESA: 0 },
  },
}

const VACIO: HistorialResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  counts: { total: 0, porResultado: {} },
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/historial']}>
        <Routes>
          <Route path="/historial" element={<HistorialPage />} />
          <Route path="/login" element={<h1>Acceso</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', 'dark')
  useAuthStore.setState({
    token: 'jwt-123',
    user: { id: 'u-1', email: 'jhon@fibex.com', name: 'Jhon Rivas', role: 'OPERADOR' },
  })
})

describe('HistorialPage', () => {
  it('muestra el encabezado de la sección', async () => {
    fetchMock.mockResolvedValue(CON_DATOS)
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'Historial General', level: 1 }),
    ).toBeInTheDocument()
  })

  it('mientras carga muestra el esqueleto y ninguna fila', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderPage()
    const cargando = await screen.findByLabelText(/cargando historial/i)
    expect(cargando).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('GST-40921')).not.toBeInTheDocument()
  })

  it('sin resultados muestra el estado vacío', async () => {
    fetchMock.mockResolvedValue(VACIO)
    renderPage()
    expect(
      await screen.findByText(/no hay gestiones/i),
    ).toBeInTheDocument()
  })

  it('cambiar de chip vuelve a consultar filtrando por ese resultado y en página 1', async () => {
    fetchMock.mockResolvedValue(CON_DATOS)
    renderPage()
    await screen.findByRole('table')

    // la chip de filtro vive en el grupo "Filtrar por resultado"
    const filtros = screen.getByRole('group', { name: /filtrar por resultado/i })
    await userEvent.click(
      within(filtros).getByRole('button', { name: /Escalado a NOC/ }),
    )

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({ resultado: 'ESCALADO_NOC', page: 1 }),
      ),
    )
  })

  it('al pulsar una fila abre el drawer con su detalle', async () => {
    fetchMock.mockResolvedValue(CON_DATOS)
    renderPage()
    const tabla = await screen.findByRole('table')
    await userEvent.click(within(tabla).getByText('Res. El Sol'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('GST-40922')).toBeInTheDocument()
  })
})
