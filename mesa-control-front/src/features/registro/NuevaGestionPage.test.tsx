import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NuevaGestionPage from './NuevaGestionPage'
import { createGestion } from '../../lib/api/gestiones'
import type { GestionResponse } from '../../lib/api/types'
import { createTestQueryClient } from '../../test/renderWithProviders'
import { useAuthStore } from '../../stores/auth.store'

// El mapa Leaflet se aísla: su interacción no se testea en unit.
vi.mock('./components/MapaUbicacion', () => ({
  MapaUbicacion: () => <div data-testid="mapa-stub" />,
}))

vi.mock('../../lib/api/gestiones', () => ({ createGestion: vi.fn() }))
const createMock = vi.mocked(createGestion)

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
  await user.type(screen.getByLabelText('Abonado / Cliente'), 'Cond. Los Robles')
  await user.type(screen.getByLabelText('Teléfono de Contacto'), '0412 555 1234')
  await user.selectOptions(screen.getByLabelText('Detalle de la Orden'), 'Sin Internet')
  await user.selectOptions(screen.getByLabelText('Solución Aplicada'), 'Reinicio de ONU')
  await user.selectOptions(screen.getByLabelText('Zona del Reporte'), 'Macuto')
  await user.selectOptions(screen.getByLabelText('Motivo de la Incidencia'), 'Corte de fibra')
  await user.type(screen.getByLabelText('Observación del SAE'), 'Cliente conforme')
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

describe('NuevaGestionPage', () => {
  it('muestra los tres grupos y el operador de la sesión (solo lectura)', () => {
    renderPage()
    expect(
      screen.getByRole('heading', { name: 'Nueva Gestión', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Datos de la Gestión')).toBeInTheDocument()
    expect(screen.getByText('Ubicación')).toBeInTheDocument()
    expect(screen.getByText('Clasificación y Cierre')).toBeInTheDocument()

    const operador = screen.getByLabelText('Operador') as HTMLInputElement
    expect(operador.value).toBe('Jhon Rivas')
    expect(operador).toHaveAttribute('readonly')
  })

  it('guardar con obligatorios vacíos muestra errores y no llama a la API', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    const errores = await screen.findAllByText('Este campo es obligatorio')
    expect(errores.length).toBeGreaterThanOrEqual(7)
    expect(createMock).not.toHaveBeenCalled()
  })

  it('guardar con datos válidos envía el payload exacto y muestra el toast', async () => {
    const user = userEvent.setup()
    createMock.mockResolvedValue({ id: 'g-1' } as GestionResponse)
    renderPage()

    await llenarObligatorios(user)
    await user.selectOptions(
      screen.getByLabelText('Resultado de la Gestión'),
      'Escalado a NOC',
    )
    await user.selectOptions(screen.getByLabelText('Tipo de Resolución'), 'NOC')

    const fecha = (screen.getByLabelText('Fecha de la Gestión') as HTMLInputElement).value
    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1))
    expect(createMock).toHaveBeenCalledWith({
      fecha,
      abonado: 'Cond. Los Robles',
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
    // el formulario se resetea; el operador se conserva
    await waitFor(() =>
      expect(
        (screen.getByLabelText('Abonado / Cliente') as HTMLInputElement).value,
      ).toBe(''),
    )
    expect(
      (screen.getByLabelText('Operador') as HTMLInputElement).value,
    ).toBe('Jhon Rivas')
  })

  it('el botón Limpiar resetea los campos sin llamar a la API', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Abonado / Cliente'), 'Algo')
    await user.click(screen.getByRole('button', { name: 'Limpiar' }))

    expect(
      (screen.getByLabelText('Abonado / Cliente') as HTMLInputElement).value,
    ).toBe('')
    expect(createMock).not.toHaveBeenCalled()
  })
})
