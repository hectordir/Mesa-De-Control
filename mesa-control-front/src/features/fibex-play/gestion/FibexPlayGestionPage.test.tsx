import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FibexPlayGestionPage from './FibexPlayGestionPage'
import { fetchFibexPlayGestion } from '../../../lib/api/fibex-play-gestion'
import { getOperadores } from '../../../lib/api/operadores'
import type { GestionResumen } from '../../../lib/api/types'
import { createTestQueryClient } from '../../../test/renderWithProviders'
import { useAuthStore } from '../../../stores/auth.store'

vi.mock('../../../lib/api/fibex-play-gestion', async () => {
  const actual = await vi.importActual<
    typeof import('../../../lib/api/fibex-play-gestion')
  >('../../../lib/api/fibex-play-gestion')
  return { ...actual, fetchFibexPlayGestion: vi.fn() }
})
vi.mock('../../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))

const fetchMock = vi.mocked(fetchFibexPlayGestion)
const operadoresMock = vi.mocked(getOperadores)

const CON_DATOS: GestionResumen = {
  kpis: { totalAtendidos: 24, solucionados: 16, enProceso: 5, escalados: 3 },
  topCanales: [
    { canal: 'ESPN', total: 6 },
    { canal: 'Cartoon Network', total: 5 },
  ],
  origen: [
    { origen: 'Señal / Transmisión', total: 10 },
    { origen: 'App / Login', total: 6 },
  ],
  registros: [
    {
      id: 'a-1',
      operador: 'Jhon Rivas',
      abonado: 'Cond. Los Robles',
      canal: 'ESPN',
      motivo: 'Sin señal',
      solucion: 'Reinicio de ONU',
      estado: 'SOLUCIONADO',
      creadoEn: '2026-07-22T14:12:00.000Z',
    },
  ],
  catalogos: {
    canales: ['ESPN', 'Cartoon Network'],
    motivos: ['Sin señal'],
    soluciones: ['Reinicio de ONU'],
    estados: ['SOLUCIONADO', 'EN_PROCESO', 'ESCALADO'],
  },
}

const VACIO: GestionResumen = {
  kpis: { totalAtendidos: 0, solucionados: 0, enProceso: 0, escalados: 0 },
  topCanales: [],
  origen: [],
  registros: [],
  catalogos: {
    canales: [],
    motivos: [],
    soluciones: [],
    estados: ['SOLUCIONADO', 'EN_PROCESO', 'ESCALADO'],
  },
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/fibex-play/gestion']}>
        <FibexPlayGestionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const kpi = (nombre: string) => screen.getByRole('group', { name: nombre })
const panel = (nombre: string | RegExp) =>
  screen.getByRole('region', { name: nombre })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', 'dark')
  operadoresMock.mockResolvedValue([{ id: 'u-1', nombre: 'Jhon Rivas' }])
  useAuthStore.setState({
    token: 'jwt-123',
    user: { id: 'u-1', email: 'op@fibex.com', name: 'Operador', role: 'OPERADOR' },
  })
})

describe('FibexPlayGestionPage · con datos', () => {
  beforeEach(() => fetchMock.mockResolvedValue(CON_DATOS))

  it('renderiza el título, el toggle y los tres KPI', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', {
        name: 'Fibex Play — Gestión de Clientes',
        level: 1,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Gestión de Clientes/i }),
    ).toHaveAttribute('aria-current', 'page')

    await screen.findByRole('group', { name: 'Total Atendidos' })
    expect(within(kpi('Total Atendidos')).getByText('24')).toBeInTheDocument()
    expect(within(kpi('Solucionados')).getByText('16')).toBeInTheDocument()
    expect(within(kpi('Escalados')).getByText('3')).toBeInTheDocument()
  })

  it('renderiza Top Canales, Origen del Problema y la tabla de la bitácora', async () => {
    renderPage()
    await screen.findByRole('region', { name: /Top Canales/i })

    const canales = panel(/Top Canales/i)
    expect(within(canales).getByText('ESPN')).toBeInTheDocument()
    expect(within(canales).getByText('Cartoon Network')).toBeInTheDocument()

    const origen = panel(/Origen del Problema/i)
    expect(within(origen).getByText('Señal / Transmisión')).toBeInTheDocument()

    const bitacora = panel(/Bitácora de Atención/i)
    expect(within(bitacora).getByText('Jhon Rivas')).toBeInTheDocument()
    expect(within(bitacora).getByText('Cond. Los Robles')).toBeInTheDocument()
    expect(within(bitacora).getByText('Solucionado')).toBeInTheDocument()
  })
})

describe('FibexPlayGestionPage · sin registros', () => {
  beforeEach(() => fetchMock.mockResolvedValue(VACIO))

  it('muestra el estado vacío de la bitácora', async () => {
    renderPage()
    const bitacora = await screen.findByRole('region', {
      name: /Bitácora de Atención/i,
    })
    expect(
      within(bitacora).getByText(/Sin registros de atención/i),
    ).toBeInTheDocument()
  })
})
