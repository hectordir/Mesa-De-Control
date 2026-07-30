import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import HistorialPage from './HistorialPage'
import { fetchHistorial } from '../../lib/api/historial'
import { getGestion } from '../../lib/api/gestiones'
import { getOperadores } from '../../lib/api/operadores'
import type {
  GestionResponse,
  GestionRow,
  HistorialResponse,
} from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

vi.mock('../../lib/api/historial', () => ({
  fetchHistorial: vi.fn(),
}))

vi.mock('../registro/components/MapaUbicacion', () => ({
  MapaUbicacion: () => <div data-testid="mapa-stub" />,
}))

vi.mock('../../lib/api/gestiones', () => ({
  getGestion: vi.fn(),
  updateGestion: vi.fn(),
}))

vi.mock('../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))

const fetchMock = vi.mocked(fetchHistorial)
const getGestionMock = vi.mocked(getGestion)
const operadoresMock = vi.mocked(getOperadores)

const fila = (over: Partial<GestionRow> = {}): GestionRow => ({
  id: 'clx1',
  codigo: 'LG-40921',
  operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
  abonado: '1002451',
  nombreCliente: 'María Pérez',
  telefono: '0412-118-4420',
  zona: 'Norte',
  canal: 'TELEGRAM',
  resultado: 'ESCALADO_NOC',
  fecha: '2026-07-17',
  hora: '10:42',
  duracionMin: 134,
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  modificadaFecha: null,
  modificadaHora: null,
  editor: null,
  ...over,
})

const CON_DATOS: HistorialResponse = {
  items: [
    fila(),
    fila({
      id: 'clx2',
      codigo: 'LG-40922',
      abonado: '1002452',
      nombreCliente: 'Luis Ramírez',
    }),
  ],
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
    expect(screen.queryByText('1002451')).not.toBeInTheDocument()
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

  it('un SUPERVISOR abre el modal de edición desde el drawer', async () => {
    useAuthStore.setState({
      token: 'jwt-123',
      user: { id: 'u-9', email: 'sup@fibex.com', name: 'Sup', role: 'SUPERVISOR' },
    })
    operadoresMock.mockResolvedValue([{ id: 'op-1', nombre: 'Jhon Rivas' }])
    getGestionMock.mockResolvedValue({
      id: 'clx2',
      codigo: 'LG-40922',
      fecha: '2026-07-17',
      operador: { id: 'op-1', nombre: 'Jhon Rivas' },
      abonado: '1002452',
      nombreCliente: 'Luis Ramírez',
      telefono: '0412-118-4420',
      detalle: 'Sin Internet',
      solucion: 'Reinicio de ONU',
      resultado: 'ESCALADO_NOC',
      tipo: 'NOC',
      requiereVisita: false,
      zona: 'Macuto',
      motivo: 'Corte de fibra',
      observacion: 'Cliente conforme',
      coordenadas: null,
      createdAt: '2026-07-17T10:42:00.000Z',
      updatedAt: null,
      updatedBy: null,
    } satisfies GestionResponse)
    fetchMock.mockResolvedValue(CON_DATOS)
    renderPage()
    const tabla = await screen.findByRole('table')
    await userEvent.click(within(tabla).getByText('Luis Ramírez'))
    await userEvent.click(screen.getByRole('button', { name: /Editar gestión/ }))

    expect(
      await screen.findByRole('heading', {
        name: 'Editar gestión · Abonado LG-1002452',
      }),
    ).toBeInTheDocument()
    expect(getGestionMock).toHaveBeenCalledWith('clx2')
  })

  it('al pulsar una fila abre el drawer con su detalle', async () => {
    fetchMock.mockResolvedValue(CON_DATOS)
    renderPage()
    const tabla = await screen.findByRole('table')
    await userEvent.click(within(tabla).getByText('Luis Ramírez'))

    const dialog = await screen.findByRole('dialog', {
      name: 'Detalle de gestión · Abonado LG-1002452',
    })
    expect(dialog).toHaveTextContent('Luis Ramírez')
    expect(dialog).toHaveTextContent('LG-1002452')
    // `codigo`, derivado del id de BD, sigue sin pintarse
    expect(dialog).not.toHaveTextContent('LG-40922')
  })

  it('ordenar por Abonado consulta con sortKey abonado', async () => {
    fetchMock.mockResolvedValue(CON_DATOS)
    renderPage()
    const tabla = await screen.findByRole('table')
    await userEvent.click(within(tabla).getByRole('button', { name: /Abonado/ }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({ sortKey: 'abonado', sortDir: 'asc', page: 1 }),
      ),
    )
  })

  it('ordenar por Cliente consulta con sortKey nombreCliente', async () => {
    fetchMock.mockResolvedValue(CON_DATOS)
    renderPage()
    const tabla = await screen.findByRole('table')
    await userEvent.click(within(tabla).getByRole('button', { name: /Cliente/ }))

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({ sortKey: 'nombreCliente', sortDir: 'asc', page: 1 }),
      ),
    )
  })
})
