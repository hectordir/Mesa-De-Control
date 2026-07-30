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
import { useDashboardDateStore } from '../../stores/dashboardDate.store'
import { formatoCorto, hoyISO } from './hooks/useOperationDay'

vi.mock('../../lib/api/dashboard', () => ({
  fetchMonitorDiario: vi.fn(),
}))

const fetchMock = vi.mocked(fetchMonitorDiario)

/**
 * Fecha pasada determinista para el calendario: el día 1 del mes anterior
 * nunca es hoy ni un día futuro (que el `DayPicker` deshabilita).
 */
function isoPrimerDiaMesAnterior(): string {
  const hoy = new Date()
  const mes = `${hoy.getMonth() === 0 ? 12 : hoy.getMonth()}`.padStart(2, '0')
  const anio = hoy.getMonth() === 0 ? hoy.getFullYear() - 1 : hoy.getFullYear()
  return `${anio}-${mes}-01`
}

/** Abre el popover del chip, retrocede un mes y elige el día 1. */
async function elegirPrimerDiaMesAnterior() {
  await userEvent.click(screen.getByTestId('chip-fecha'))
  await userEvent.click(screen.getByRole('button', { name: 'Ir al mes anterior' }))
  await userEvent.click(screen.getByRole('button', { name: /\b1 de / }))
}

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

/** Lista larga de operadores: fuerza el scroll propio de la tabla. */
const RESPUESTA_LARGA: MonitorDiarioResumen = {
  ...RESPUESTA_CON_DATOS,
  operadores: Array.from({ length: 24 }, (_, indice) => ({
    id: `op-largo-${indice + 1}`,
    nombre: `Operador ${indice + 1}`,
    clientes: 10,
    mesa: 8,
    soporte2: 1,
    noc: 1,
  })),
}

/** Actividad larga: fuerza el scroll propio del radar. */
const RESPUESTA_RADAR_LARGO: MonitorDiarioResumen = {
  ...RESPUESTA_CON_DATOS,
  actividad: Array.from({ length: 20 }, (_, indice) => ({
    id: `act-largo-${indice + 1}`,
    operador: `Operador ${indice + 1}`,
    resultado: 'SOLUCIONADO_MESA' as const,
    ubicacion: `Sector ${indice + 1}`,
    hora: '2026-07-17T10:42:00-04:00',
  })),
}

/**
 * Día de poco volumen (el caso real del 25/07/2026): dos gestiones. Los paneles
 * quedan con listas cortas que no llenan su contenedor.
 */
const RESPUESTA_POCOS_DATOS: MonitorDiarioResumen = {
  ...RESPUESTA_CON_DATOS,
  operadores: RESPUESTA_CON_DATOS.operadores.slice(0, 2),
  topAverias: RESPUESTA_CON_DATOS.topAverias.slice(0, 2),
  actividad: RESPUESTA_CON_DATOS.actividad.slice(0, 2),
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
  // La fecha del dashboard es un store global que sobrevive entre tests: si no
  // se restablece, el día elegido por un test filtra al siguiente.
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

    // 1 cabecera + 5 operadores + el Total (pie fijado al fondo del scroll)
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

    const total = screen.getByRole('row', { name: /^Total/ })
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

    // cabecera + la única coincidencia + el Total
    await waitFor(() =>
      expect(within(tabla).getAllByRole('row')).toHaveLength(3),
    )
    expect(within(tabla).getByText('María León')).toBeInTheDocument()
    expect(within(tabla).queryByText('Jhon Rivas')).not.toBeInTheDocument()
    // el Total se recalcula con el resultado filtrado
    expect(
      within(screen.getByRole('row', { name: /^Total/ }))
        .getAllByRole('cell')
        .map((c) => c.textContent),
    ).toEqual(['Total', '66', '52', '9', '6'])
  })

  it('empareja la altura de la primera fila y deja que la segunda mida su contenido', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })

    // fila 1: los dos paneles comparten altura (la dona crece para llenarla)
    const operadores = panel(/resumen por operador/i)
    const distribucion = panel(/distribución de resultados/i)
    const fila1 = operadores.parentElement as HTMLElement
    expect(distribucion.parentElement).toBe(fila1)
    expect(fila1.className).toContain('items-stretch')
    expect(fila1.className).not.toContain('items-start')

    // fila 2: sigue midiendo su contenido, sin estirarse a la altura del vecino
    const averias = panel(/top 5 averías/i)
    const radar = panel(/radar de operaciones/i)
    const fila2 = averias.parentElement as HTMLElement
    expect(radar.parentElement).toBe(fila2)
    expect(fila2.className).toContain('items-start')

    // `Panel` sigue siendo neutro: ningún panel se estira por su cuenta
    for (const seccion of [operadores, distribucion, averias, radar]) {
      expect(seccion).not.toHaveClass('h-full')
    }
  })

  it('llena el panel de distribución con la dona en vez de con hueco muerto', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })

    const dona = panel(/distribución de resultados/i)
    // el cuerpo crece hasta el fondo del panel estirado, sin repartir hueco
    const contenidoDona = within(dona).getByRole('list').parentElement as HTMLElement
    expect(contenidoDona.className).toContain('flex-1')
    expect(contenidoDona.className).not.toContain('content-center')

    // la dona crece a 240px (antes 172) para llenar ese alto, y sigue circular
    const grafico = within(dona).getByRole('img', { name: /distribución de/i })
    expect(grafico.className).toContain('h-[240px]')
    expect(grafico.className).toContain('w-[240px]')
    // el anillo escala con el diámetro: nada se deforma al crecer
    expect(grafico.firstElementChild?.className).toContain('inset-[15%]')

    // las 5 barras cierran el panel: nada crece para repartir el hueco
    const averias = panel(/top 5 averías/i)
    const barras = within(averias).getAllByRole('meter')
    expect(barras).toHaveLength(5)
    const contenidoAverias = barras[4].parentElement?.parentElement as HTMLElement
    expect(contenidoAverias.className).not.toContain('flex-1')
    expect(contenidoAverias.lastElementChild).toBe(barras[4].parentElement)

    // el `min-h` de los estados vacío/carga no se cuela en el estado con datos.
    // La fila 2 sí lleva un mínimo propio y explícito (ver el test de altura
    // estable con pocos datos); el resto de paneles no puede inventarse alto.
    for (const seccion of [dona, panel(/resumen por operador/i)]) {
      for (const nodo of seccion.querySelectorAll('*')) {
        expect(nodo.className.toString()).not.toMatch(/min-h-\[/)
      }
    }
  })

  it('la fila 2 no encoge con pocos datos: mínimo de 260px en ambos paneles', async () => {
    fetchMock.mockResolvedValue(RESPUESTA_POCOS_DATOS)
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })

    // 260px de cuerpo + 75px de cabecera = los 335px que mide la fila llena
    const averias = panel(/top 5 averías/i)
    const barras = within(averias).getAllByRole('meter')
    expect(barras).toHaveLength(2)
    const contenidoAverias = barras[1].parentElement?.parentElement as HTMLElement
    expect(contenidoAverias.className).toContain('min-h-[260px]')

    const radar = panel(/radar de operaciones/i)
    const items = within(radar).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    const scrollRadar = items[0].parentElement?.parentElement as HTMLElement
    expect(scrollRadar.className).toContain('min-h-[260px]')
    // el mismo tope de antes: con lista larga sigue acotado, no crece
    expect(scrollRadar.className).toContain('max-h-[260px]')
  })

  it('deja el TOTAL al fondo del panel aunque haya una sola fila', async () => {
    fetchMock.mockResolvedValue(RESPUESTA_POCOS_DATOS)
    renderPage()
    const tabla = await screen.findByRole('table', { name: /resumen por operador/i })

    // cabecera + 2 operadores + Total: el relleno no cuenta como fila
    expect(within(tabla).getAllByRole('row')).toHaveLength(4)

    // altura fija (no `max-h`) + tabla `h-full`: el `tfoot` cae al fondo del
    // panel aunque el `tbody` no lo llene
    const scroll = tabla.parentElement as HTMLElement
    expect(scroll.className).toContain('h-[280px]')
    expect(scroll.className).not.toContain('max-h-[280px]')
    expect(tabla.className).toContain('h-full')

    // el hueco lo absorbe una fila de relleno; las de datos guardan su alto
    const filas = Array.from(tabla.querySelectorAll('tbody tr'))
    expect(filas).toHaveLength(3)
    for (const fila of filas.slice(0, 2)) {
      expect(fila.className).toContain('h-px')
    }
    const relleno = filas[2]
    expect(relleno).toHaveAttribute('aria-hidden', 'true')
    expect(relleno.className).toContain('h-full')
    expect(relleno.querySelector('td')).toHaveAttribute('colspan', '5')

    // y sigue siendo una sola tabla: mismo `colgroup`, columnas alineadas
    expect(screen.getAllByRole('table', { name: /operador|total/i })).toHaveLength(1)
    expect(tabla.querySelectorAll('colgroup')).toHaveLength(1)
    const total = within(tabla).getByRole('row', { name: /^Total/ })
    expect(tabla.querySelector('tfoot')?.contains(total)).toBe(true)
  })

  it('renderiza toda la actividad del radar dentro de un área con scroll acotada', async () => {
    fetchMock.mockResolvedValue(RESPUESTA_RADAR_LARGO)
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })
    const radar = panel(/radar de operaciones/i)

    const items = within(radar).getAllByRole('listitem')
    expect(items).toHaveLength(20)
    expect(within(radar).getByText('Sector 20')).toBeInTheDocument()

    const lista = items[0].parentElement as HTMLElement
    const scroll = lista.parentElement as HTMLElement
    expect(scroll.className).toContain('am-scroll')
    expect(scroll.className).toContain('overflow-y-auto')
    // tope a la altura de las 5 barras de "Top 5 Averías" (~258px), su vecino
    // de fila: el radar deja de descolgarse ahora que nadie se estira
    expect(scroll.className).toContain('max-h-[260px]')

    // la cabecera y el indicador "En vivo" quedan fuera del área que hace scroll
    expect(scroll.contains(within(radar).getByText('En vivo'))).toBe(false)
    expect(
      scroll.contains(
        within(radar).getByRole('heading', { name: 'Radar de Operaciones' }),
      ),
    ).toBe(false)
  })

  it('renderiza todas las filas de operadores dentro de un área con scroll y cabecera fija', async () => {
    fetchMock.mockResolvedValue(RESPUESTA_LARGA)
    renderPage()
    const tabla = await screen.findByRole('table', { name: /resumen por operador/i })

    // 1 cabecera + 24 operadores + el Total
    expect(within(tabla).getAllByRole('row')).toHaveLength(26)
    expect(within(tabla).getByText('Operador 24')).toBeInTheDocument()

    const scroll = tabla.parentElement as HTMLElement
    expect(scroll.className).toContain('am-scroll')
    expect(scroll.className).toContain('overflow-y-auto')
    // alto fijo alineado con la dona de al lado: la fila 1 cierra pareja
    // (280px de cuerpo, TOTAL incluido = 240px de dona + 40px de padding)
    expect(scroll.className).toContain('h-[280px]')

    for (const col of ['Operador', 'Clientes', 'Mesa', 'Sop. 2', 'NOC']) {
      const cabecera = within(tabla).getByRole('columnheader', { name: col })
      expect(cabecera.className).toContain('sticky')
      expect(cabecera.className).toContain('top-0')
      // fondo opaco del tema: las filas no se ven pasar por debajo
      expect(cabecera.className).toMatch(/bg-surface(\s|$)/)
    }
  })

  it('mantiene la fila TOTAL visible, fijada al fondo del área con scroll', async () => {
    fetchMock.mockResolvedValue(RESPUESTA_LARGA)
    renderPage()
    const tabla = await screen.findByRole('table', { name: /resumen por operador/i })

    // una sola tabla: la fila TOTAL comparte `colgroup` con las de operador y
    // sus números caen exactamente bajo los de cada columna, haya barra o no
    expect(screen.getAllByRole('table', { name: /operador|total/i })).toHaveLength(1)
    const total = within(tabla).getByRole('row', { name: /^Total/ })
    expect(tabla.querySelector('tfoot')?.contains(total)).toBe(true)
    expect(
      within(total).getAllByRole('cell').map((c) => c.textContent),
    ).toEqual(['Total', '240', '192', '24', '24'])

    // sigue a la vista al desplazar la lista, con fondo opaco del tema
    for (const celda of within(total).getAllByRole('cell')) {
      expect(celda.className).toContain('sticky')
      expect(celda.className).toContain('bottom-0')
      expect(celda.className).toContain('bg-surface-elevated')
    }
  })

  it('alinea el rótulo OPERADOR con los nombres y los numéricos con sus cifras', async () => {
    renderPage()
    const tabla = await screen.findByRole('table', { name: /resumen por operador/i })

    const operador = within(tabla).getByRole('columnheader', { name: 'Operador' })
    expect(operador.className).toContain('text-left')
    expect(operador.className).not.toContain('text-right')

    for (const col of ['Clientes', 'Mesa', 'Sop. 2', 'NOC']) {
      const cabecera = within(tabla).getByRole('columnheader', { name: col })
      expect(cabecera.className).toContain('text-right')
      expect(cabecera.className).not.toContain('text-left')
    }
  })

  it('arranca en hoy: pide esa fecha y "Volver a hoy" queda deshabilitado', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })

    expect(fetchMock).toHaveBeenCalledWith(hoyISO())
    expect(screen.getByTestId('chip-fecha')).toHaveTextContent(
      formatoCorto(hoyISO()),
    )
    expect(screen.getByRole('button', { name: /volver a hoy/i })).toBeDisabled()
  })

  it('elegir otra fecha en el calendario vuelve a consultar el back con ese día', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })

    await elegirPrimerDiaMesAnterior()

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(isoPrimerDiaMesAnterior()),
    )
    expect(
      screen.getByRole('heading', { name: 'Monitor Diario', level: 1 }),
    ).toBeInTheDocument()
  })

  it('"Volver a hoy" recarga los datos del día actual', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })

    await elegirPrimerDiaMesAnterior()
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(isoPrimerDiaMesAnterior()),
    )

    const volver = screen.getByRole('button', { name: /volver a hoy/i })
    expect(volver).toBeEnabled()
    await userEvent.click(volver)

    await waitFor(() =>
      expect(screen.getByTestId('chip-fecha')).toHaveTextContent(
        formatoCorto(hoyISO()),
      ),
    )
    expect(fetchMock).toHaveBeenLastCalledWith(hoyISO())
    expect(screen.getByRole('button', { name: /volver a hoy/i })).toBeDisabled()
  })

  it('no muestra el reporte de Telegram: queda comentado hasta decidir su uso', async () => {
    renderPage()
    await screen.findByRole('table', { name: /resumen por operador/i })
    expect(
      screen.queryByRole('button', { name: /generar reporte telegram/i }),
    ).toBeNull()
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
