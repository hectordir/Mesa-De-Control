import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AdminPage from './AdminPage'
import { deleteGestiones, fetchSupervisionResumen } from '../../lib/api/supervision'
import { getOperadores } from '../../lib/api/operadores'
import type { SupervisionResumen } from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

// Leaflet no funciona en jsdom: lo stubeamos con una API encadenable inerte.
vi.mock('leaflet', () => {
  const chain = () => stub
  const stub: Record<string, unknown> = {
    addTo: () => stub,
    setView: () => stub,
    remove: () => {},
    bindTooltip: () => stub,
    invalidateSize: () => {},
  }
  const L = {
    map: chain,
    tileLayer: chain,
    layerGroup: chain,
    circle: chain,
    marker: chain,
    divIcon: chain,
    control: { zoom: chain },
  }
  return { default: L, ...L }
})

vi.mock('../../lib/api/supervision', () => ({
  fetchSupervisionResumen: vi.fn(),
  deleteGestiones: vi.fn(),
}))
vi.mock('../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))

const fetchMock = vi.mocked(fetchSupervisionResumen)
const deleteMock = vi.mocked(deleteGestiones)
const operadoresMock = vi.mocked(getOperadores)

const resumen = (over: Partial<SupervisionResumen> = {}): SupervisionResumen => ({
  fecha: '2026-07-23',
  kpis: {
    atendidosHoy: 142,
    atendidosDelta: 12,
    efectividad: 87,
    efectividadMeta: 85,
    escaladosNoc: 9,
    escaladosDelta: -3,
    slaCumplido: 94,
    slaMeta: 90,
  },
  zonas: [
    { nombre: 'Caraballeda', count: 14, estado: 'danger' },
    { nombre: 'Macuto', count: 8, estado: 'warning' },
  ],
  bandejaN2: [
    {
      id: 'b-1',
      orden: '#OS-4821',
      abonado: '1002451',
      zona: 'Caraballeda',
      motivo: 'Corte de fibra',
      dias: 4,
      estado: 'Escalado NOC',
    },
  ],
  sla: [
    { key: '0', label: '0 días', count: 5 },
    { key: '1', label: '1 día', count: 3 },
    { key: '2', label: '2 días', count: 2 },
    { key: '3', label: '3 días', count: 1 },
    { key: '4+', label: '4+ días', count: 2 },
  ],
  heatmap: {
    motivos: ['Falla LOS', 'Internet Lento'],
    filas: [{ zona: 'Caraballeda', celdas: [4, 3], total: 7 }],
  },
  depuracion: [
    { id: 'g-1', fecha: '2026-07-23', operador: 'José V.', abonado: '1004871' },
    { id: 'g-2', fecha: '2026-07-22', operador: 'Keyla G.', abonado: '1010245' },
  ],
  ...over,
})

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/admin']}>
        <AdminPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', 'dark')
  operadoresMock.mockResolvedValue([{ id: 'op-1', nombre: 'Andrea Pérez' }])
  useAuthStore.setState({
    token: 'jwt-123',
    user: { id: 'u-1', email: 'admin@fibex.com', name: 'Admin', role: 'ADMIN' },
  })
})

describe('AdminPage', () => {
  it('muestra KPIs, zonas, SLA y HeatMap con los datos del resumen', async () => {
    fetchMock.mockResolvedValue(resumen())
    renderPage()

    expect(await screen.findByText('Atendidos hoy')).toBeInTheDocument()
    expect(screen.getByText('142')).toBeInTheDocument()
    // zona en el overlay del mapa
    expect(screen.getAllByText('Caraballeda').length).toBeGreaterThan(0)
    // total SLA = 5+3+2+1+2 = 13
    expect(screen.getByText('Total pendientes')).toBeInTheDocument()
    expect(screen.getByText('13')).toBeInTheDocument()
    // HeatMap: cabecera de motivo
    expect(screen.getByRole('columnheader', { name: 'Falla LOS' })).toBeInTheDocument()
  })

  it('acota la altura de Bandeja N2 y Depuración con scroll interno', async () => {
    fetchMock.mockResolvedValue(resumen())
    renderPage()

    const bandeja = await screen.findByTestId('bandeja-scroll')
    expect(bandeja).toHaveClass('overflow-y-auto')
    expect(bandeja.className).toMatch(/max-h-\[\d+px\]/)

    const depuracion = screen.getByTestId('depuracion-scroll')
    expect(depuracion).toHaveClass('overflow-y-auto')
    expect(depuracion.className).toMatch(/max-h-\[\d+px\]/)
  })

  it('el overlay de incidencias es compacto y scrollea con muchas zonas', async () => {
    fetchMock.mockResolvedValue(resumen())
    renderPage()

    const overlay = await screen.findByTestId('zonas-overlay')
    expect(overlay).toHaveClass('overflow-y-auto')
    expect(overlay.className).toMatch(/max-h-\[\d+px\]/)
  })

  it('con la bandeja N2 vacía muestra "¡Todo limpio!"', async () => {
    fetchMock.mockResolvedValue(resumen({ bandejaN2: [] }))
    renderPage()

    expect(await screen.findByText('¡Todo limpio!')).toBeInTheDocument()
  })

  it('seleccionar filas y Eliminar dispara el borrado con los ids correctos', async () => {
    fetchMock.mockResolvedValue(resumen())
    deleteMock.mockResolvedValue({ deleted: 1 })
    renderPage()

    const fila = await screen.findByLabelText(/Seleccionar 1004871/i)
    await userEvent.click(fila)

    const boton = screen.getByRole('button', { name: /Eliminar 1 seleccionada/i })
    await userEvent.click(boton)

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith(['g-1']))
  })

  it('lista los operadores del catálogo desde GET /operadores', async () => {
    fetchMock.mockResolvedValue(resumen())
    renderPage()

    await screen.findByText('Atendidos hoy')
    expect(await screen.findByText('Andrea Pérez')).toBeInTheDocument()
  })
})
