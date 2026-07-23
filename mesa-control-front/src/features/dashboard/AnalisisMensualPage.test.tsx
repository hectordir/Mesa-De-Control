import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AnalisisMensualPage from './AnalisisMensualPage'
import { fetchAnalisisMensual } from '../../lib/api/dashboard'
import type { AnalisisMensualResponse } from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

vi.mock('../../lib/api/dashboard', () => ({
  fetchAnalisisMensual: vi.fn(),
}))

const fetchMock = vi.mocked(fetchAnalisisMensual)

/** Los números del diseño. */
const RESPUESTA_CON_DATOS: AnalisisMensualResponse = {
  periodo: '2026-05',
  kpis: { volumen: 485, resueltos: 209, escalados: 22, metaEfectividad: 65 },
  serie: [
    { mes: 'Febrero', periodo: '2026-02', resueltas: 545, resto: 735 },
    { mes: 'Marzo', periodo: '2026-03', resueltas: 470, resto: 1150 },
    { mes: 'Abril', periodo: '2026-04', resueltas: 720, resto: 980 },
    { mes: 'Mayo', periodo: '2026-05', resueltas: 209, resto: 276 },
  ],
  heatmap: {
    motivos: ['Falla LOS', 'Internet Lento', 'Sin Internet'],
    zonas: [
      { zona: 'Canaima', valores: [0, 4, 8] },
      { zona: 'Caraballeda', valores: [2, 1, 0] },
      { zona: 'Macuto', valores: [1, 1, 1] },
      { zona: 'Maiquetía', valores: [3, 0, 2] },
    ],
  },
  distribucion: [
    { motivo: 'Falla LOS', total: 140 },
    { motivo: 'Usuario Clave ONT', total: 118 },
    { motivo: 'Internet Lento', total: 72 },
    { motivo: 'Sin Internet', total: 64 },
    { motivo: 'Caídas Seguidas', total: 39 },
  ],
  operadores: [
    { id: 'o1', nombre: 'José V.', solucionados: 79, enviadosN2: 67, total: 159 },
    { id: 'o2', nombre: 'Keyla G.', solucionados: 42, enviadosN2: 50, total: 97 },
    { id: 'o3', nombre: 'Thais D.', solucionados: 33, enviadosN2: 44, total: 88 },
  ],
  tendencia: [
    { fecha: '2026-05-20', atendidos: 40 },
    { fecha: '2026-05-21', atendidos: 80 },
  ],
}

const RESPUESTA_VACIA: AnalisisMensualResponse = {
  periodo: '2026-05',
  kpis: { volumen: 0, resueltos: 0, escalados: 0, metaEfectividad: 65 },
  serie: [],
  heatmap: { motivos: [], zonas: [] },
  distribucion: [],
  operadores: [],
  tendencia: [],
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/dashboard/analisis-mensual']}>
        <Routes>
          <Route path="/dashboard" element={<h1>Monitor Diario</h1>} />
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

const panel = (nombre: string | RegExp) =>
  screen.getByRole('region', { name: nombre })

const kpi = (nombre: string) => screen.getByRole('group', { name: nombre })

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

describe('AnalisisMensualPage · estado con datos', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(RESPUESTA_CON_DATOS)
  })

  it('muestra el encabezado de la vista y el mes consultado', async () => {
    renderPage()
    expect(
      await screen.findByRole('heading', { name: 'Análisis Mensual', level: 1 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/^Vista analítica y consolidada · /),
    ).toBeInTheDocument()
  })

  it('el toggle enlaza con Monitor Diario y marca la vista activa', async () => {
    renderPage()
    const diario = await screen.findByRole('link', { name: 'Monitor Diario' })
    const mensual = screen.getByRole('link', { name: /Análisis Mensual/ })

    expect(diario).toHaveAttribute('href', '/dashboard')
    expect(mensual).toHaveAttribute('href', '/dashboard/analisis-mensual')
    expect(mensual).toHaveAttribute('aria-current', 'page')
    expect(diario).not.toHaveAttribute('aria-current')

    await userEvent.click(diario)
    expect(
      screen.getByRole('heading', { name: 'Monitor Diario', level: 1 }),
    ).toBeInTheDocument()
  })

  it('muestra los tres KPI del mes', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })

    expect(within(kpi('Volumen Mensual')).getByText('485')).toBeInTheDocument()
    expect(
      within(kpi('Volumen Mensual')).getByText('gestiones registradas en el mes'),
    ).toBeInTheDocument()

    const efectividad = kpi('Efectividad Global')
    expect(within(efectividad).getByText('43%')).toBeInTheDocument()
    expect(within(efectividad).getByText('209 resueltos')).toBeInTheDocument()
    expect(within(efectividad).getByText('Meta de equipo: 65%')).toBeInTheDocument()
    expect(within(efectividad).getByText('22 pts bajo meta')).toBeInTheDocument()

    expect(within(kpi('Escalados NOC')).getByText('22')).toBeInTheDocument()
    expect(
      within(kpi('Escalados NOC')).getByText('casos derivados al NOC'),
    ).toBeInTheDocument()
  })

  it('dibuja el chart apilado con leyenda, eje y meses', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })
    const chart = panel(/gestiones por mes/i)

    expect(
      within(chart).getByText(
        'Resueltas vs. resto del volumen · últimos 4 meses',
      ),
    ).toBeInTheDocument()
    expect(within(chart).getByText('Gestiones Resueltas')).toBeInTheDocument()
    expect(within(chart).getByText('Resto de Gestiones')).toBeInTheDocument()

    for (const tick of ['0', '450', '900', '1.350', '1.800']) {
      expect(within(chart).getByText(tick)).toBeInTheDocument()
    }
    const columnas = within(chart).getAllByRole('figure')
    expect(columnas).toHaveLength(4)
    expect(columnas[0]).toHaveAccessibleName(
      'Febrero · 1.280 gestiones, 43% de efectividad',
    )
    // el mes aparece bajo la columna y como título de su tooltip
    expect(within(columnas[0]).getAllByText('Febrero')).toHaveLength(2)
  })

  it('el tooltip de cada barra detalla resueltas, resto y total', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })
    const chart = panel(/gestiones por mes/i)
    const marzo = within(chart).getAllByRole('figure')[1]

    expect(within(marzo).getByText('470')).toBeInTheDocument()
    expect(within(marzo).getByText('1.150')).toBeInTheDocument()
    expect(within(marzo).getByText('1.620')).toBeInTheDocument()
    expect(within(marzo).getByText('Total · 29% efect.')).toBeInTheDocument()
  })

  it('pinta el heatmap con sus columnas, totales y pie', async () => {
    renderPage()
    const tabla = await screen.findByRole('table', { name: /heatmap mensual/i })

    for (const col of [
      'Zona',
      'Falla LOS',
      'Internet Lento',
      'Sin Internet',
      'Total',
    ]) {
      expect(
        within(tabla).getByRole('columnheader', { name: col }),
      ).toBeInTheDocument()
    }
    // cabecera + 4 zonas
    expect(within(tabla).getAllByRole('row')).toHaveLength(5)
    const canaima = within(tabla).getByRole('row', { name: /^Canaima/ })
    expect(
      within(canaima).getAllByRole('cell').map((c) => c.textContent),
    ).toEqual(['Canaima', '0', '4', '8', '12'])

    const heatmap = panel(/heatmap mensual/i)
    expect(within(heatmap).getByText('4 zonas monitoreadas')).toBeInTheDocument()
    expect(within(heatmap).getByText('23')).toBeInTheDocument()
  })

  it('filtra las zonas del heatmap por nombre', async () => {
    renderPage()
    const tabla = await screen.findByRole('table', { name: /heatmap mensual/i })

    await userEvent.type(screen.getByLabelText(/buscar zona/i), 'mai')
    await waitFor(() =>
      expect(within(tabla).getAllByRole('row')).toHaveLength(2),
    )
    expect(within(tabla).getByText('Maiquetía')).toBeInTheDocument()
    expect(screen.getByText('1 de 4 zonas')).toBeInTheDocument()
  })

  it('avisa cuando ninguna zona coincide', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })

    await userEvent.type(screen.getByLabelText(/buscar zona/i), 'zzz')
    expect(
      await screen.findByText('Ninguna zona coincide con “zzz”.'),
    ).toBeInTheDocument()
  })

  it('cambiar de mes vuelve a consultar el nuevo periodo', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })

    const select = screen.getByLabelText(/filtro mensual/i)
    const opciones = within(select).getAllByRole('option')
    await userEvent.selectOptions(select, opciones[3])

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        (opciones[3] as HTMLOptionElement).value,
      ),
    )
  })
})

describe('AnalisisMensualPage · bloque analítico', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(RESPUESTA_CON_DATOS)
  })

  it('renderiza los siete paneles y el encabezado de flujo diario', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })

    for (const titulo of [
      'Distribución de Solicitudes',
      'Total de Clientes Atendidos',
      'Solución vs Nivel 2',
      'Tendencia de Atención Mensual',
      'Desglose de Cantidades',
      'Top Operadores del Mes',
      'Averías Recurrentes',
    ]) {
      expect(panel(titulo)).toBeInTheDocument()
    }
    expect(
      screen.getByRole('heading', { name: 'Monitoreo de Flujo Diario', level: 2 }),
    ).toBeInTheDocument()
  })

  it('el donut muestra el volumen total y porcentajes que suman 100', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })
    const donut = panel('Distribución de Solicitudes')

    expect(within(donut).getByText('485')).toBeInTheDocument()
    // 140+118+72+64+39 = 433 → 32/27/17/15/9 = 100
    for (const pct of ['32%', '27%', '17%', '15%', '9%']) {
      expect(within(donut).getByText(pct)).toBeInTheDocument()
    }
  })

  it('Solución vs Nivel 2: seleccionar un operador abre su detalle y re-click lo cierra', async () => {
    renderPage()
    await screen.findByRole('table', { name: /heatmap mensual/i })
    const izquierda = panel('Solución vs Nivel 2')

    expect(
      screen.getByText(
        'Selecciona un operador a la izquierda para inspeccionar',
      ),
    ).toBeInTheDocument()

    await userEvent.click(
      within(izquierda).getByRole('button', { name: 'José V.' }),
    )

    expect(screen.getByText('159 gestiones en total')).toBeInTheDocument()
    expect(screen.getByText('79')).toBeInTheDocument()
    expect(screen.getByText('67')).toBeInTheDocument()
    expect(screen.getByText('54%')).toBeInTheDocument()

    await userEvent.click(
      within(izquierda).getByRole('button', { name: 'José V.' }),
    )
    expect(
      screen.getByText(
        'Selecciona un operador a la izquierda para inspeccionar',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText('159 gestiones en total')).not.toBeInTheDocument()
  })
})

describe('AnalisisMensualPage · estado de carga', () => {
  it('muestra esqueletos y ningún valor', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    renderPage()

    const kpis = await screen.findByRole('region', {
      name: /indicadores del mes/i,
    })
    expect(kpis).toHaveAttribute('aria-busy', 'true')
    expect(within(kpis).queryByText('485')).not.toBeInTheDocument()
    expect(panel(/gestiones por mes/i)).toHaveAttribute('aria-busy', 'true')
    expect(panel(/heatmap mensual/i)).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('AnalisisMensualPage · estado vacío', () => {
  beforeEach(() => {
    fetchMock.mockResolvedValue(RESPUESTA_VACIA)
  })

  it('muestra los KPI en cero con sus metas vacías', async () => {
    renderPage()
    await screen.findByText('Sin datos para el mes seleccionado')

    expect(within(kpi('Volumen Mensual')).getByText('0')).toBeInTheDocument()
    expect(
      within(kpi('Volumen Mensual')).getByText('sin gestiones registradas'),
    ).toBeInTheDocument()
    expect(within(kpi('Efectividad Global')).getByText('0%')).toBeInTheDocument()
    expect(within(kpi('Efectividad Global')).getByText('—')).toBeInTheDocument()
    expect(
      within(kpi('Efectividad Global')).queryByText(/resueltos/),
    ).not.toBeInTheDocument()
    expect(within(kpi('Escalados NOC')).getByText('sin escalados')).toBeInTheDocument()
  })

  it('muestra el vacío de cada panel', async () => {
    renderPage()
    for (const texto of [
      'Sin datos para el mes seleccionado',
      'Elige un mes con gestiones registradas para ver la comparación de volumen.',
      'Sin incidencias en el mes seleccionado',
      'El mapa de calor se llenará conforme se registren averías por zona y motivo.',
    ]) {
      expect(await screen.findByText(texto)).toBeInTheDocument()
    }
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('el bloque analítico degrada a una tarjeta "Analítica no disponible"', async () => {
    renderPage()
    expect(
      await screen.findByRole('region', { name: 'Analítica no disponible' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Distribución de Solicitudes' }),
    ).not.toBeInTheDocument()
  })
})

describe('AnalisisMensualPage · estado de error', () => {
  it('un fallo de red muestra el aviso accesible y reintenta la consulta', async () => {
    fetchMock.mockRejectedValueOnce(new Error('sin red'))
    fetchMock.mockResolvedValue(RESPUESTA_CON_DATOS)
    renderPage()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/no se pudieron cargar los datos/i)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByRole('table', { name: /heatmap mensual/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('un mes sin gestiones (200 con volumen 0) no es un error', async () => {
    fetchMock.mockResolvedValue(RESPUESTA_VACIA)
    renderPage()

    expect(
      await screen.findByText('Sin incidencias en el mes seleccionado'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
