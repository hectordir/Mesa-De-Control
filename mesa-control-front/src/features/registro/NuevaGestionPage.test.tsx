import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NuevaGestionPage from './NuevaGestionPage'
import { createGestion } from '../../lib/api/gestiones'
import { getOperadores } from '../../lib/api/operadores'
import type { GestionResponse, OperadorOption } from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

// El mapa Leaflet se aísla: su interacción no se testea en unit.
vi.mock('./components/MapaUbicacion', () => ({
  MapaUbicacion: () => <div data-testid="mapa-stub" />,
}))

vi.mock('../../lib/api/gestiones', () => ({ createGestion: vi.fn() }))
const createMock = vi.mocked(createGestion)

vi.mock('../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))
const operadoresMock = vi.mocked(getOperadores)

const OPERADORES: OperadorOption[] = [
  { id: 'u-2', nombre: 'Andrea Pérez' },
  { id: 'u-1', nombre: 'Jhon Rivas' },
  { id: 'u-3', nombre: 'María Bastidas' },
]

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/registro']}>
        <NuevaGestionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

async function llenarObligatorios(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Abonado'), '  12345678  ')
  await user.type(screen.getByLabelText('Nombre del Cliente'), '  María Pérez  ')
  await user.type(screen.getByLabelText('Teléfono de Contacto'), '0412 555 1234')
  await user.selectOptions(screen.getByLabelText('Detalle de la Orden'), 'Sin Internet')
  await user.selectOptions(screen.getByLabelText('Solución Aplicada'), 'Reinicio de ONU')
  await user.selectOptions(screen.getByLabelText('Zona del Reporte'), 'Macuto')
  await user.selectOptions(screen.getByLabelText('Motivo de la Incidencia'), 'Corte de fibra')
  await user.type(screen.getByLabelText('Observación del SAE'), 'Cliente conforme')
}

/** Réplica de `hoy()`: fecha local por defecto del formulario. */
function hoyISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  document.documentElement.setAttribute('data-theme', 'dark')
  operadoresMock.mockResolvedValue(OPERADORES)
  useAuthStore.setState({
    token: 'jwt-123',
    user: { id: 'u-1', email: 'jhon@fibex.com', name: 'Jhon Rivas', role: 'OPERADOR' },
  })
})

describe('NuevaGestionPage', () => {
  it('muestra los tres grupos y puebla el select de operador precargando la sesión', async () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: 'Nueva Gestión', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Datos de la Gestión')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.getByText('Clasificación y Cierre')).toBeInTheDocument()

    const operador = screen.getByLabelText('Operador') as HTMLSelectElement
    expect(operador.tagName).toBe('SELECT')
    // opciones desde GET /operadores
    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'Jhon Rivas' })).toBeInTheDocument(),
    )
    expect(screen.getByRole('option', { name: 'Andrea Pérez' })).toBeInTheDocument()
    // precarga el operador de la sesión
    await waitFor(() => expect(operador.value).toBe('u-1'))
  })

  it('sugiere el nombre del cliente como persona, no como condominio', () => {
    renderPage()

    expect(screen.getByLabelText('Nombre del Cliente')).toHaveAttribute(
      'placeholder',
      'María Pérez',
    )
    expect(
      screen.queryByPlaceholderText(/cond\.|condominio|res\.|urb\.|torre|edif\./i),
    ).not.toBeInTheDocument()
  })

  it('guardar con obligatorios vacíos muestra errores y no llama a la API', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    const errores = await screen.findAllByText('Este campo es obligatorio')
    expect(errores).toHaveLength(7)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('la observación vacía no impide registrar la gestión', async () => {
    const user = userEvent.setup()
    renderPage()
    await waitFor(() =>
      expect((screen.getByLabelText('Operador') as HTMLSelectElement).value).toBe(
        'u-1',
      ),
    )

    await user.type(screen.getByLabelText('Abonado'), '1002451')
    await user.type(screen.getByLabelText('Nombre del Cliente'), 'María Pérez')
    await user.type(screen.getByLabelText('Teléfono de Contacto'), '0412-118-4420')
    await user.selectOptions(screen.getByLabelText('Detalle de la Orden'), 'Sin Internet')
    await user.selectOptions(
      screen.getByLabelText('Solución Aplicada'),
      'Reinicio de ONU',
    )
    await user.selectOptions(screen.getByLabelText('Zona del Reporte'), 'Macuto')
    await user.selectOptions(
      screen.getByLabelText('Motivo de la Incidencia'),
      'Corte de fibra',
    )
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
    expect(createMock.mock.calls[0][0]).toMatchObject({ observacion: '' })
  })

  it('renombra el campo a "Abonado" y añade "Nombre del Cliente" justo después', () => {
    renderPage()

    expect(screen.getByLabelText('Abonado')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del Cliente')).toBeInTheDocument()
    expect(screen.queryByLabelText('Abonado / Cliente')).not.toBeInTheDocument()
    expect(screen.queryByText('Abonado / Cliente')).not.toBeInTheDocument()
  })

  it('no renderiza el panel derecho de Estado del Sistema ni el Consejo', () => {
    renderPage()

    expect(screen.queryByText('Estado del Sistema')).not.toBeInTheDocument()
    expect(screen.queryByText('Consejo')).not.toBeInTheDocument()
  })

  it('guardar sin "Nombre del Cliente" marca el error y no llama a la API', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Abonado'), '12345678')
    await user.type(screen.getByLabelText('Teléfono de Contacto'), '0412 555 1234')
    await user.selectOptions(screen.getByLabelText('Detalle de la Orden'), 'Sin Internet')
    await user.selectOptions(screen.getByLabelText('Solución Aplicada'), 'Reinicio de ONU')
    await user.selectOptions(screen.getByLabelText('Zona del Reporte'), 'Macuto')
    await user.selectOptions(
      screen.getByLabelText('Motivo de la Incidencia'),
      'Corte de fibra',
    )
    await user.type(screen.getByLabelText('Observación del SAE'), 'Cliente conforme')

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    const errores = await screen.findAllByText('Este campo es obligatorio')
    expect(errores).toHaveLength(1)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('guardar con datos válidos envía el payload exacto (con el operadorId elegido) y muestra el toast', async () => {
    const user = userEvent.setup()
    createMock.mockResolvedValue({ id: 'g-1' } as GestionResponse)
    renderPage()

    // esperar la precarga del select antes de elegir otro operador
    const operador = screen.getByLabelText('Operador') as HTMLSelectElement
    await waitFor(() => expect(operador.value).toBe('u-1'))
    await user.selectOptions(operador, 'María Bastidas')

    await llenarObligatorios(user)
    await user.selectOptions(
      screen.getByLabelText('Resultado de la Gestión'),
      'Escalado a NOC',
    )
    await user.selectOptions(screen.getByLabelText('Tipo de Resolución'), 'NOC')

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
    expect(createMock).toHaveBeenCalledWith({
      operadorId: 'u-3',
      fecha: hoyISO(),
      abonado: '12345678',
      nombreCliente: 'María Pérez',
      telefono: '0412 555 1234',
      detalle: 'Sin Internet',
      solucion: 'Reinicio de ONU',
      resultado: 'ESCALADO_NOC',
      tipo: 'NOC',
      requiereVisita: false,
      zona: 'Macuto',
      motivo: 'Corte de fibra',
      observacion: 'Cliente conforme',
      coordenadas: null,
    })

    expect(await screen.findByRole('status')).toHaveTextContent('Gestión guardada')
    // el formulario se resetea; el operador seleccionado se conserva
    await waitFor(() =>
      expect((screen.getByLabelText('Abonado') as HTMLInputElement).value).toBe(''),
    )
    expect(
      (screen.getByLabelText('Nombre del Cliente') as HTMLInputElement).value,
    ).toBe('')
    expect((screen.getByLabelText('Operador') as HTMLSelectElement).value).toBe('u-3')
  })

  it('el botón Limpiar resetea los campos sin llamar a la API', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Abonado'), 'Algo')
    await user.type(screen.getByLabelText('Nombre del Cliente'), 'Alguien')
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))

    expect((screen.getByLabelText('Abonado') as HTMLInputElement).value).toBe('')
    expect(
      (screen.getByLabelText('Nombre del Cliente') as HTMLInputElement).value,
    ).toBe('')
    expect(createMock).not.toHaveBeenCalled()
  })
})
