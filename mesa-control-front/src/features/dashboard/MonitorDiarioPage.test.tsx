import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MonitorDiarioPage from './MonitorDiarioPage'
import { fetchMonitorDiario } from '../../lib/api/dashboard'
import type { MonitorDiarioResumen } from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

vi.mock('../../lib/api/dashboard', () => ({
  fetchMonitorDiario: vi.fn(),
}))

const fetchMock = vi.mocked(fetchMonitorDiario)

/** Respuesta de ejemplo del endpoint: los números del diseño. */
const RESPUESTA_CON_DATOS: MonitorDiarioResumen = {
  fecha: '2026-07-17',
  kpis: {
    clientesAtendidos: 342,
    efectividadMesa: 78,
    enviadoSoporte2: 54,
    escaladoNoc: 31,
    pendienteCliente: 38,
  },
  operadores: [
    { id: 'op-1', nombre: 'Jhon Rivas', clientes: 78, mesa: 63, soporte2: 11, noc: 7 },
    { id: 'op-2', nombre: 'María León', clientes: 66, mesa: 52, soporte2: 9, noc: 6 },
    { id: 'op-3', nombre: 'Carlos Díaz', clientes: 59, mesa: 40, soporte2: 13, noc: 6 },
    { id: 'op-4', nombre: 'Ana Quintero', clientes: 71, mesa: 58, soporte2: 10, noc: 7 },
    { id: 'op-5', nombre: 'Luis Parra', clientes: 68, mesa: 54, soporte2: 11, noc: 5 },
  ],
  distribucion: [
    { resultado: 'SOLUCIONADO_MESA', total: 198 },
    { resultado: 'ENVIADO_SOPORTE2', total: 54 },
    { resultado: 'ESCALADO_NOC', total: 31 },
    { resultado: 'PENDIENTE_CLIENTE', total: 38 },
    { resultado: 'REAGENDADO', total: 21 },
  ],
  topAverias: [
    { motivo: 'Corte de fibra (FTTH)', total: 84 },
    { motivo: 'Sin señal / ONT', total: 61 },
    { motivo: 'Lentitud de navegación', total: 47 },
    { motivo: 'Falla en IPTV', total: 33 },
    { motivo: 'WiFi intermitente', total: 28 },
  ],
  actividad: [
    {
      id: 'act-1',
      operador: 'Jhon Rivas',
      resultado: 'SOLUCIONADO_MESA',
      ubicacion: 'Cond. Los Robles',
      hora: '2026-07-17T10:42:00-04:00',
    },
    {
      id: 'act-2',
      operador: 'María León',
      resultado: 'ENVIADO_SOPORTE2',
      ubicacion: 'Torre Aurora',
      hora: '2026-07-17T10:39:00-04:00',
    },
    {
      id: 'act-3',
      operador: 'Carlos Díaz',
      resultado: 'ESCALADO_NOC',
      ubicacion: 'Res. El Mirador',
      hora: '2026-07-17T10:31:00-04:00',
    },
    {
      id: 'act-4',
      operador: 'Ana Quintero',
      resultado: 'PENDIENTE_CLIENTE',
      ubicacion: 'Plaza Central',
      hora: '2026-07-17T10:25:00-04:00',
    },
    {
      id: 'act-5',
      operador: 'Luis Parra',
      resultado: 'SOLUCIONADO_MESA',
      ubicacion: 'Barrio San Luis',
      hora: '2026-07-17T10:18:00-04:00',
    },
  ],
}

/**
 * Día sin gestiones tal como responde el back: `200`, KPI en 0, arrays vacíos y
 * la distribución con los cinco resultados en 0.
 */
const RESPUESTA_VACIA: MonitorDiarioResumen = {
  fecha: '2026-07-17',
  kpis: {
    clientesAtendidos: 0,
    efectividadMesa: 0,
    enviadoSoporte2: 0,
    escaladoNoc: 0,
    pendienteCliente: 0,
  },
  operadores: [],
  distribucion: [
    { resultado: 'SOLUCIONADO_MESA', total: 0 },
    { resultado: 'ENVIADO_SOPORTE2', total: 0 },
    { resultado: 'ESCALADO_NOC', total: 0 },
    { resultado: 'PENDIENTE_CLIENTE', total: 0 },
    { resultado: 'REAGENDADO', total: 0 },
  ],
  topAverias: [],
  actividad: [],
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<MonitorDiarioPage />} />
          <Route path="/login" element={<h1>Acceso</h1>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const panel = (nombre: string | RegExp) =>
  screen.getByRole('region', { name: nombre })

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', 'dark')
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

describe('MonitorDiarioPage · estado con datos', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(RESPUESTA_CON_DATOS)
  })

  it('muestra el encabezado de la vista', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'Monitor Diario', level: 1 }),
    ).toBeInTheDocument()
  })

  it('muestra los cinco KPI con sus valores', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })
    const kpis = screen.getByRole('region', { name: /indicadores del día/i })

    for (const [label, valor] of [
      ['Clientes Atendidos', '342'],
      ['Efectividad Mesa', '78%'],
      ['Enviado a Soporte 2', '54'],
      ['Escalado a NOC', '31'],
      ['Pendiente Cliente', '38'],
    ] as const) {
      const tarjeta = within(kpis).getByRole('group', { name: label })
      expect(within(tarjeta).getByText(valor)).toBeInTheDocument()
    }
  })

  it('lista los cinco operadores y la fila Total con las sumas', async () => {
    renderPage()
    const tabla = await screen.findByRole('table', { name: /resumen por operador/i })

    // 1 cabecera + 5 operadores + total
    expect(within(tabla).getAllByRole('row')).toHaveLength(7)
    for (const nombre of [
      'Jhon Rivas',
      'María León',
      'Carlos Díaz',
      'Ana Quintero',
      'Luis Parra',
    ]) {
      expect(within(tabla).getByText(nombre)).toBeInTheDocument()
    }
    for (const col of ['Operador', 'Clientes', 'Mesa', 'Sop. 2', 'NOC']) {
      expect(within(tabla).getByRole('columnheader', { name: col })).toBeInTheDocument()
    }

    const total = within(tabla).getByRole('row', { name: /^Total/ })
    expect(
      within(total).getAllByRole('cell').map((c) => c.textContent),
    ).toEqual(['Total', '342', '267', '54', '31'])
  })

  it('muestra la efectividad derivada de cada operador', async () => {
    renderPage()
    const tabla = await screen.findByRole('table', { name: /resumen por operador/i })
    expect(within(tabla).getByText('81% efectividad')).toBeInTheDocument()
    expect(within(tabla).getByText('68% efectividad')).toBeInTheDocument()
  })

  it('muestra el donut con su total y las cinco leyendas con porcentaje', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })
    const distribucion = panel(/distribución de resultados/i)

    expect(within(distribucion).getByText('342')).toBeInTheDocument()
    const leyendas = within(distribucion).getAllByRole('listitem')
    expect(leyendas).toHaveLength(5)
    expect(leyendas.map((l) => l.textContent)).toEqual([
      'Solucionado en Mesa19857.9%',
      'Enviado a Soporte 25415.8%',
      'Escalado a NOC319.1%',
      'Pendiente Cliente3811.1%',
      'Reagendado216.1%',
    ])
  })

  it('muestra las cinco averías con su barra proporcional', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })
    const averias = panel(/top 5 averías/i)

    const barras = within(averias).getAllByRole('meter')
    expect(barras).toHaveLength(5)
    expect(within(averias).getByText('Corte de fibra (FTTH)')).toBeInTheDocument()
    expect(barras[0]).toHaveAttribute('aria-valuenow', '84')
  })

  it('muestra las cinco entradas del radar con hora y ubicación', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })
    const radar = panel(/radar de operaciones/i)

    expect(within(radar).getAllByRole('listitem')).toHaveLength(5)
    expect(within(radar).getAllByText('solucionó en Mesa')).toHaveLength(2)
    expect(within(radar).getByText('Cond. Los Robles')).toBeInTheDocument()
    expect(within(radar).getByText('10:42')).toBeInTheDocument()
  })

  it('filtra las filas de operador por nombre', async () => {
    renderPage()
    const tabla = await screen.findByRole('table', { name: /resumen por operador/i })

    await userEvent.type(screen.getByLabelText(/buscar operador/i), 'leó')

    await waitFor(() =>
      expect(within(tabla).getAllByRole('row')).toHaveLength(3),
    )
    expect(within(tabla).getByText('María León')).toBeInTheDocument()
    expect(within(tabla).queryByText('Jhon Rivas')).not.toBeInTheDocument()
  })

  it('pide los datos de la fecha de operación y permite volver a hoy', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
    await userEvent.click(screen.getByRole('button', { name: /volver a hoy/i }))
    expect(
      screen.getByRole('heading', { name: 'Monitor Diario', level: 1 }),
    ).toBeInTheDocument()
  })

  it('deja el reporte de Telegram fuera de alcance (deshabilitado)', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })
    expect(
      screen.getByRole('button', { name: /generar reporte telegram/i }),
    ).toBeDisabled()
  })
})

describe('MonitorDiarioPage · estado de carga', () => {
  it('muestra esqueletos y ningún valor de KPI', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderPage()

    const kpis = await screen.findByRole('region', { name: /indicadores del día/i })
    expect(kpis).toHaveAttribute('aria-busy', 'true')
    expect(within(kpis).queryByText('342')).not.toBeInTheDocument()
    expect(within(kpis).getByRole('group', { name: 'Clientes Atendidos' })).toBeInTheDocument()
    expect(panel(/resumen por operador/i)).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('MonitorDiarioPage · estado vacío', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(RESPUESTA_VACIA)
  })

  it('muestra los KPI en cero con su meta vacía', async () => {
    renderPage()
    await screen.findByText('Aún no hay gestiones hoy')
    const kpis = screen.getByRole('region', { name: /indicadores del día/i })

    expect(
      within(within(kpis).getByRole('group', { name: 'Clientes Atendidos' })).getByText('0'),
    ).toBeInTheDocument()
    expect(
      within(within(kpis).getByRole('group', { name: 'Efectividad Mesa' })).getByText('0%'),
    ).toBeInTheDocument()
    expect(within(kpis).getByText('sin registro hoy')).toBeInTheDocument()
  })

  it('muestra el texto vacío de cada panel', async () => {
    renderPage()
    for (const texto of [
      'Aún no hay gestiones hoy',
      'Sin gestiones para graficar',
      'Sin averías registradas hoy',
      'Sin actividad reciente',
    ]) {
      expect(await screen.findByText(texto)).toBeInTheDocument()
    }
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('MonitorDiarioPage · estado de error', () => {
  it('muestra el aviso y reintenta la consulta', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))
    fetchMock.mockResolvedValue(RESPUESTA_CON_DATOS)
    renderPage()

    expect(
      await screen.findByText(/no se pudieron cargar los datos/i),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('table', { name: /resumen por operador/i }),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
