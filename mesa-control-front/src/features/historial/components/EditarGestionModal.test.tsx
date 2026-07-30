import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EditarGestionModal } from './EditarGestionModal'
import { getGestion, updateGestion } from '../../../lib/api/gestiones'
import { getOperadores } from '../../../lib/api/operadores'
import type { GestionResponse, OperadorOption } from '../../../lib/api/types'
import { createTestQueryClient } from '../../../test/renderWithProviders'

vi.mock('../../registro/components/MapaUbicacion', () => ({
  MapaUbicacion: () => <div data-testid="mapa-stub" />,
}))

vi.mock('../../../lib/api/gestiones', () => ({
  getGestion: vi.fn(),
  updateGestion: vi.fn(),
}))
const getMock = vi.mocked(getGestion)
const updateMock = vi.mocked(updateGestion)

vi.mock('../../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))
const operadoresMock = vi.mocked(getOperadores)

const OPERADORES: OperadorOption[] = [
  { id: 'u-1', nombre: 'Jhon Rivas' },
  { id: 'u-3', nombre: 'María Bastidas' },
]

const detalle: GestionResponse = {
  id: 'g-1',
  codigo: 'LG-40921',
  fecha: '2026-07-17',
  operador: { id: 'u-1', nombre: 'Jhon Rivas' },
  abonado: '100245',
  nombreCliente: 'María Pérez',
  telefono: '0412-118-4420',
  detalle: 'Sin Internet',
  solucion: 'Reinicio de ONU',
  resultado: 'ESCALADO_NOC',
  tipo: 'NOC',
  requiereVisita: true,
  zona: 'Macuto',
  motivo: 'Corte de fibra',
  observacion: 'Cliente conforme',
  coordenadas: '10.6012, -66.9311',
  createdAt: '2026-07-17T10:42:00.000Z',
  updatedAt: null,
  updatedBy: null,
}

/** Gestión reagendada: 548 filas en BD con este resultado. */
const detalleReagendado: GestionResponse = {
  ...detalle,
  id: 'g-2',
  codigo: 'LG-40922',
  resultado: 'REAGENDADO',
}

/**
 * Gestión sembrada tal como está en BD: `detalle`, `solucion`, `tipo` y
 * `observacion` en `''`. El fixture completo de arriba escondía los defectos
 * de placeholder y de obligatoriedad.
 */
const detalleSembrado: GestionResponse = {
  ...detalle,
  id: 'g-3',
  codigo: 'LG-40923',
  detalle: '',
  solucion: '',
  tipo: '',
  observacion: '',
}

/** Orden exacto de los 14 campos, idéntico al del registro (spec §8). */
const ORDEN_CAMPOS = [
  'Fecha de la Gestión',
  'Operador',
  'Abonado',
  'Nombre del Cliente',
  'Teléfono de Contacto',
  'Detalle de la Orden',
  'Solución Aplicada',
  'Resultado de la Gestión',
  'Tipo de Resolución',
  'Requiere Visita Técnica',
  'Coordenadas del Pin',
  'Zona del Reporte',
  'Motivo de la Incidencia',
  'Observación del SAE',
]

function renderModal(onClose = vi.fn()) {
  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <EditarGestionModal gestionId="g-1" onClose={onClose} />
    </QueryClientProvider>,
  )
  return onClose
}

const esperarFormulario = () =>
  screen.findByRole('button', { name: 'Guardar cambios' })

beforeEach(() => {
  vi.clearAllMocks()
  operadoresMock.mockResolvedValue(OPERADORES)
  getMock.mockResolvedValue(detalle)
  updateMock.mockResolvedValue(detalle)
})

describe('EditarGestionModal', () => {
  it('no renderiza nada sin gestión seleccionada', () => {
    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <EditarGestionModal gestionId={null} onClose={vi.fn()} />
      </QueryClientProvider>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(getMock).not.toHaveBeenCalled()
  })

  it('muestra el estado de carga mientras llega el detalle', () => {
    getMock.mockReturnValue(new Promise(() => {}))
    renderModal()
    expect(screen.getByRole('status')).toHaveTextContent(/Cargando/i)
  })

  it('muestra un error si el detalle no se puede cargar', async () => {
    getMock.mockRejectedValue(new Error('boom'))
    renderModal()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /No se pudo cargar la gestión/i,
    )
  })

  it('titula el modal con el abonado prefijado de la gestión', async () => {
    renderModal()
    expect(
      await screen.findByRole('heading', {
        name: 'Editar gestión · Abonado LG-100245',
      }),
    ).toBeInTheDocument()
    // `codigo`, derivado del id de BD, sigue sin pintarse
    expect(screen.getByRole('dialog')).not.toHaveTextContent('LG-40921')
    expect(getMock).toHaveBeenCalledWith('g-1')
  })

  it('precarga los 14 campos en el mismo orden que el registro', async () => {
    renderModal()
    await esperarFormulario()
    const dialog = screen.getByRole('dialog')

    const nodos = ORDEN_CAMPOS.map((label) =>
      within(dialog).getByLabelText(new RegExp(`^${label}`)),
    )
    for (let i = 0; i < nodos.length - 1; i += 1) {
      const pos = nodos[i].compareDocumentPosition(nodos[i + 1])
      expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }

    expect((screen.getByLabelText('Abonado') as HTMLInputElement).value).toBe(
      '100245',
    )
    expect(
      (screen.getByLabelText('Nombre del Cliente') as HTMLInputElement).value,
    ).toBe('María Pérez')
    expect(
      (screen.getByLabelText('Teléfono de Contacto') as HTMLInputElement).value,
    ).toBe('0412-118-4420')
    expect(
      (screen.getByLabelText('Detalle de la Orden') as HTMLSelectElement).value,
    ).toBe('Sin Internet')
    expect(
      (screen.getByLabelText('Solución Aplicada') as HTMLSelectElement).value,
    ).toBe('Reinicio de ONU')
    expect(
      (screen.getByLabelText('Resultado de la Gestión') as HTMLSelectElement).value,
    ).toBe('ESCALADO_NOC')
    expect(
      (screen.getByLabelText('Tipo de Resolución') as HTMLSelectElement).value,
    ).toBe('NOC')
    expect(
      (screen.getByLabelText('Requiere Visita Técnica') as HTMLInputElement).checked,
    ).toBe(true)
    expect(
      (screen.getByLabelText('Coordenadas del Pin') as HTMLInputElement).value,
    ).toBe('10.6012, -66.9311')
    expect((screen.getByLabelText('Zona del Reporte') as HTMLSelectElement).value).toBe(
      'Macuto',
    )
    expect(
      (screen.getByLabelText('Motivo de la Incidencia') as HTMLSelectElement).value,
    ).toBe('Corte de fibra')
    expect(
      (screen.getByLabelText('Observación del SAE') as HTMLTextAreaElement).value,
    ).toBe('Cliente conforme')
    await waitFor(() =>
      expect((screen.getByLabelText('Operador') as HTMLSelectElement).value).toBe(
        'u-1',
      ),
    )
  })

  it('conserva un valor legado que no está en el catálogo de opciones', async () => {
    getMock.mockResolvedValue({
      ...detalle,
      zona: 'Zona Fantasma',
      motivo: 'Motivo Legado',
      detalle: 'Detalle Legado',
      solucion: 'Solución Legada',
    })
    const user = userEvent.setup()
    renderModal()
    await esperarFormulario()

    // el valor legado queda seleccionado, no se pierde
    expect((screen.getByLabelText('Zona del Reporte') as HTMLSelectElement).value).toBe(
      'Zona Fantasma',
    )
    expect(
      (screen.getByLabelText('Motivo de la Incidencia') as HTMLSelectElement).value,
    ).toBe('Motivo Legado')
    expect(
      (screen.getByLabelText('Detalle de la Orden') as HTMLSelectElement).value,
    ).toBe('Detalle Legado')
    expect(
      (screen.getByLabelText('Solución Aplicada') as HTMLSelectElement).value,
    ).toBe('Solución Legada')

    // y viaja intacto al guardar sin tocar esos campos
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1))
    expect(updateMock.mock.calls[0][1]).toMatchObject({
      zona: 'Zona Fantasma',
      motivo: 'Motivo Legado',
      detalle: 'Detalle Legado',
      solucion: 'Solución Legada',
    })
  })

  it('muestra REAGENDADO en el select y no lo sobrescribe al guardar', async () => {
    getMock.mockResolvedValue(detalleReagendado)
    const user = userEvent.setup()
    renderModal()
    await esperarFormulario()

    const select = screen.getByLabelText(
      'Resultado de la Gestión',
    ) as HTMLSelectElement
    // el select muestra el resultado real, no el primero del catálogo
    expect(select.value).toBe('REAGENDADO')
    expect(select.options[select.selectedIndex].text).toBe('Reagendado')

    // el operador confirma el valor que el select le presenta como actual
    // (gesto inocuo) y edita otro campo: el resultado debe sobrevivir
    fireEvent.change(select, {
      target: { value: select.options[select.selectedIndex].value },
    })
    await user.clear(screen.getByLabelText('Nombre del Cliente'))
    await user.type(screen.getByLabelText('Nombre del Cliente'), 'Ana Gómez')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1))
    expect(updateMock.mock.calls[0][1].resultado).toBe('REAGENDADO')
  })

  it('conserva un resultado fuera de catálogo en lugar de caer al primero', async () => {
    getMock.mockResolvedValue({
      ...detalle,
      resultado: 'RESULTADO_LEGADO' as GestionResponse['resultado'],
    })
    renderModal()
    await esperarFormulario()

    expect(
      (screen.getByLabelText('Resultado de la Gestión') as HTMLSelectElement).value,
    ).toBe('RESULTADO_LEGADO')
  })

  it('deja el Tipo de Resolución en el placeholder cuando llega vacío', async () => {
    getMock.mockResolvedValue(detalleSembrado)
    renderModal()
    await esperarFormulario()

    const tipo = screen.getByLabelText('Tipo de Resolución') as HTMLSelectElement
    expect(tipo.value).toBe('')
    expect(tipo.options[tipo.selectedIndex].text).toMatch(/Selecciona un tipo/i)
  })

  it('guarda una gestión sembrada sin observación', async () => {
    getMock.mockResolvedValue({ ...detalleSembrado, detalle: 'Sin Internet', solucion: 'Reinicio de ONU' })
    const user = userEvent.setup()
    renderModal()
    await esperarFormulario()

    expect(
      (screen.getByLabelText('Observación del SAE') as HTMLTextAreaElement).value,
    ).toBe('')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1))
    expect(updateMock.mock.calls[0][1].observacion).toBe('')
  })

  it('guarda los cambios con el payload completo y cierra', async () => {
    const user = userEvent.setup()
    const onClose = renderModal()
    await esperarFormulario()

    await user.clear(screen.getByLabelText('Nombre del Cliente'))
    await user.type(screen.getByLabelText('Nombre del Cliente'), 'Ana Gómez')
    await user.selectOptions(screen.getByLabelText('Zona del Reporte'), 'Pariata')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1))
    expect(updateMock).toHaveBeenCalledWith('g-1', {
      operadorId: 'u-1',
      fecha: '2026-07-17',
      abonado: '100245',
      nombreCliente: 'Ana Gómez',
      telefono: '0412-118-4420',
      detalle: 'Sin Internet',
      solucion: 'Reinicio de ONU',
      resultado: 'ESCALADO_NOC',
      tipo: 'NOC',
      requiereVisita: true,
      zona: 'Pariata',
      motivo: 'Corte de fibra',
      observacion: 'Cliente conforme',
      coordenadas: '10.6012, -66.9311',
    })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('no guarda si un obligatorio queda vacío', async () => {
    const user = userEvent.setup()
    renderModal()
    await esperarFormulario()

    await user.clear(screen.getByLabelText('Nombre del Cliente'))
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Este campo es obligatorio')).toBeInTheDocument()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('avisa si el guardado falla y no cierra', async () => {
    updateMock.mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    const onClose = renderModal()
    await esperarFormulario()

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /No se pudo guardar/i,
    )
    expect(onClose).not.toHaveBeenCalled()
  })

  it('Cancelar cierra sin guardar', async () => {
    const user = userEvent.setup()
    const onClose = renderModal()
    await esperarFormulario()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('Escape cierra sin guardar', async () => {
    const user = userEvent.setup()
    const onClose = renderModal()
    await esperarFormulario()

    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('el backdrop cierra sin guardar', async () => {
    const user = userEvent.setup()
    const onClose = renderModal()
    await esperarFormulario()

    await user.click(screen.getByRole('button', { name: 'Cerrar overlay de edición' }))
    expect(onClose).toHaveBeenCalled()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('es un diálogo modal que atrapa el foco', async () => {
    const user = userEvent.setup()
    renderModal()
    await esperarFormulario()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    // el foco entra en el diálogo al abrir…
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true))

    // …y desde el último foco tabulable vuelve al primero, sin escapar
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    )
    focusables[focusables.length - 1].focus()
    await user.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
    expect(document.activeElement).toBe(focusables[0])
  })
})
