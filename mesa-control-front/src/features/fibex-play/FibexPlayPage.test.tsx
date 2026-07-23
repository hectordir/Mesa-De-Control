import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FibexPlayPage from './FibexPlayPage'
import { fetchFibexPlay } from '../../lib/api/fibex-play'
import type { FibexPlayResumen } from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

vi.mock('../../lib/api/fibex-play', async () => {
  const actual = await vi.importActual<typeof import('../../lib/api/fibex-play')>(
    '../../lib/api/fibex-play',
  )
  return { ...actual, fetchFibexPlay: vi.fn() }
})

const fetchMock = vi.mocked(fetchFibexPlay)

const CON_FALLAS: FibexPlayResumen = {
  actualizadoEn: '2026-07-22T10:58:00.000Z',
  kpis: { total: 165, operativos: 159, caidos: 6, saludGrilla: 96 },
  distribucionSeveridad: [
    { severidad: 'CRITICA', total: 2 },
    { severidad: 'ALTA', total: 2 },
    { severidad: 'MEDIA', total: 2 },
  ],
  fallas: [
    {
      id: 'c1',
      nombre: 'ESPN',
      categoria: 'DEPORTES',
      tipoIncidencia: 'SIN_SENAL',
      severidad: 'CRITICA',
      hora: '09:42',
      detectadoEn: '2026-07-22T09:42:00.000Z',
    },
    {
      id: 'c2',
      nombre: 'HBO Max',
      categoria: 'PREMIUM',
      tipoIncidencia: 'AUDIO_DESINCRONIZADO',
      severidad: 'MEDIA',
      hora: '10:39',
      detectadoEn: '2026-07-22T10:39:00.000Z',
    },
  ],
}

const OPERATIVO: FibexPlayResumen = {
  actualizadoEn: '2026-07-22T10:58:00.000Z',
  kpis: { total: 165, operativos: 165, caidos: 0, saludGrilla: 100 },
  distribucionSeveridad: [],
  fallas: [],
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/fibex-play']}>
        <FibexPlayPage />
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
  useAuthStore.setState({
    token: 'jwt-123',
    user: { id: 'u-1', email: 'op@fibex.com', name: 'Operador', role: 'OPERADOR' },
  })
})

describe('FibexPlayPage · encabezado y KPIs', () => {
  beforeEach(() => fetchMock.mockResolvedValue(CON_FALLAS))

  it('renderiza el título y los tres KPI de la grilla', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'Fibex Play', level: 1 }),
    ).toBeInTheDocument()
    await screen.findByRole('group', { name: 'Canales Totales' })

    expect(within(kpi('Canales Totales')).getByText('165')).toBeInTheDocument()
    expect(within(kpi('Salud de Grilla')).getByText('96%')).toBeInTheDocument()
    expect(within(kpi('Salud de Grilla')).getByText('159 operativos')).toBeInTheDocument()
    expect(within(kpi('Canales Caídos')).getByText('6')).toBeInTheDocument()
  })
})

describe('FibexPlayPage · modo con fallas (caidos > 0)', () => {
  beforeEach(() => fetchMock.mockResolvedValue(CON_FALLAS))

  it('muestra el badge global de caídos y la lista/timeline de incidencias', async () => {
    renderPage()
    await screen.findByRole('region', { name: 'Detalles de Falla' })

    expect(screen.getByText('6 canales caídos')).toBeInTheDocument()

    const detalles = panel('Detalles de Falla')
    expect(within(detalles).getByText('ESPN')).toBeInTheDocument()
    expect(
      within(detalles).getByText('Deportes · Sin señal'),
    ).toBeInTheDocument()
    expect(within(detalles).getByText('2 activas')).toBeInTheDocument()

    const distribucion = panel('Distribución de Fallas')
    expect(
      within(distribucion).getByRole('img', {
        name: /por severidad/i,
      }),
    ).toBeInTheDocument()

    const novedades = panel('Reporte de Novedades')
    expect(
      within(novedades).getByText('ESPN — Sin señal'),
    ).toBeInTheDocument()
    expect(within(novedades).getByText('09:42')).toBeInTheDocument()
  })
})

describe('FibexPlayPage · modo operativo (caidos === 0)', () => {
  beforeEach(() => fetchMock.mockResolvedValue(OPERATIVO))

  it('muestra transmisión estable, 100% estable y el panel de éxito', async () => {
    renderPage()
    await screen.findByText('Grilla 100% operativa')

    expect(screen.getByText('Transmisión estable')).toBeInTheDocument()
    expect(within(kpi('Canales Caídos')).getByText('0')).toBeInTheDocument()
    expect(
      within(kpi('Canales Caídos')).getByText('ningún canal requiere revisión'),
    ).toBeInTheDocument()

    expect(
      within(panel('Distribución de Fallas')).getByText('Grilla 100% estable'),
    ).toBeInTheDocument()
    expect(
      within(panel('Detalles de Falla')).getByText('Sin detalles'),
    ).toBeInTheDocument()
    expect(
      within(panel('Reporte de Novedades')).getByText('Grilla 100% operativa'),
    ).toBeInTheDocument()
  })
})
