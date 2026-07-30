import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MonitorDiarioPage from './MonitorDiarioPage'
import AnalisisMensualPage from './AnalisisMensualPage'
import { fetchAnalisisMensual, fetchMonitorDiario } from '../../lib/api/dashboard'
import type {
  AnalisisMensualResponse,
  MonitorDiarioResumen,
} from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'
import { useDashboardDateStore } from '../../stores/dashboardDate.store'
import { formatoCorto, hoyISO } from './hooks/useOperationDay'

vi.mock('../../lib/api/dashboard', () => ({
  fetchMonitorDiario: vi.fn(),
  fetchAnalisisMensual: vi.fn(),
}))

const diarioMock = vi.mocked(fetchMonitorDiario)
const mensualMock = vi.mocked(fetchAnalisisMensual)

const DIARIO: MonitorDiarioResumen = {
  fecha: '2026-07-17',
  kpis: {
    clientesAtendidos: 0,
    efectividadMesa: 0,
    enviadoSoporte2: 0,
    escaladoNoc: 0,
    pendienteCliente: 0,
  },
  operadores: [],
  distribucion: [],
  topAverias: [],
  actividad: [],
}

const MENSUAL: AnalisisMensualResponse = {
  periodo: '2026-05',
  kpis: { volumen: 0, resueltos: 0, escalados: 0, metaEfectividad: 65 },
  serie: [],
  heatmap: { motivos: [], zonas: [] },
  distribucion: [],
  operadores: [],
  tendencia: [],
}

function renderApp(ruta: string) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/dashboard" element={<MonitorDiarioPage />} />
          <Route
            path="/dashboard/analisis-mensual"
            element={<AnalisisMensualPage />}
          />
          <Route path="/login" element={<h1>Acceso</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const irA = async (nombre: RegExp) =>
  userEvent.click(screen.getByRole('link', { name: nombre }))

/** Mes anterior en `YYYY-MM` (siempre pasado, siempre entre las 12 opciones). */
function mesAnterior(): string {
  const hoy = new Date()
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  return `${fecha.getFullYear()}-${`${fecha.getMonth() + 1}`.padStart(2, '0')}`
}

/** Elige el día 22 del mes anterior en el calendario del Monitor Diario. */
async function elegirDia22MesAnterior() {
  await userEvent.click(screen.getByTestId('chip-fecha'))
  await userEvent.click(screen.getByRole('button', { name: 'Ir al mes anterior' }))
  await userEvent.click(screen.getByRole('button', { name: /\b22 de / }))
}

beforeEach(() => {
  vi.clearAllMocks()
  diarioMock.mockResolvedValue(DIARIO)
  mensualMock.mockResolvedValue(MENSUAL)
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', 'dark')
  // El store del dashboard es global: sin este reset, un test arrastraría la
  // fecha del anterior y el orden de ejecución cambiaría el resultado.
  useDashboardDateStore.setState({ fecha: hoyISO() })
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

describe('fecha sincronizada entre Monitor Diario y Análisis Mensual', () => {
  it('elegir un mes en Análisis Mensual lleva al Monitor Diario al día 1 de ese mes', async () => {
    renderApp('/dashboard/analisis-mensual')
    await screen.findByRole('heading', { name: 'Análisis Mensual', level: 1 })

    const select = screen.getByLabelText(/filtro mensual/i)
    await userEvent.selectOptions(select, mesAnterior())
    await waitFor(() => expect(mensualMock).toHaveBeenCalledWith(mesAnterior()))

    await irA(/^Monitor Diario$/)

    await waitFor(() =>
      expect(diarioMock).toHaveBeenLastCalledWith(`${mesAnterior()}-01`),
    )
    expect(screen.getByTestId('chip-fecha')).toHaveTextContent(
      formatoCorto(`${mesAnterior()}-01`),
    )
  })

  it('elegir un día en Monitor Diario lleva al Análisis Mensual a ese mes', async () => {
    renderApp('/dashboard')
    await screen.findByRole('heading', { name: 'Monitor Diario', level: 1 })

    await elegirDia22MesAnterior()
    await waitFor(() =>
      expect(diarioMock).toHaveBeenLastCalledWith(`${mesAnterior()}-22`),
    )

    await irA(/Análisis Mensual/)

    await waitFor(() =>
      expect(mensualMock).toHaveBeenLastCalledWith(mesAnterior()),
    )
    expect(screen.getByLabelText(/filtro mensual/i)).toHaveValue(mesAnterior())
  })

  it('ir y volver sin tocar nada conserva el día exacto (el 22, no el 1)', async () => {
    renderApp('/dashboard')
    await screen.findByRole('heading', { name: 'Monitor Diario', level: 1 })
    await elegirDia22MesAnterior()

    await irA(/Análisis Mensual/)
    await screen.findByRole('heading', { name: 'Análisis Mensual', level: 1 })
    await irA(/^Monitor Diario$/)

    expect(screen.getByTestId('chip-fecha')).toHaveTextContent(
      formatoCorto(`${mesAnterior()}-22`),
    )
    expect(diarioMock).toHaveBeenLastCalledWith(`${mesAnterior()}-22`)
  })

  it('"Volver a hoy" en el Monitor Diario devuelve también el mes en curso', async () => {
    renderApp('/dashboard')
    await screen.findByRole('heading', { name: 'Monitor Diario', level: 1 })
    await elegirDia22MesAnterior()

    await userEvent.click(screen.getByRole('button', { name: /volver a hoy/i }))
    await irA(/Análisis Mensual/)

    await waitFor(() =>
      expect(mensualMock).toHaveBeenLastCalledWith(hoyISO().slice(0, 7)),
    )
  })
})
