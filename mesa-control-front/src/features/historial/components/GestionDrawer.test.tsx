import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GestionDrawer } from './GestionDrawer'
import type { GestionRow, Role } from '../../../lib/api/types'
import { useAuthStore } from '../../../stores/auth.store'

function sesionCon(role: Role) {
  useAuthStore.setState({
    token: 'jwt',
    user: { id: 'u-1', email: 'a@b.com', name: 'Ana', role },
  })
}

const gestion: GestionRow = {
  id: 'clx1',
  codigo: 'LG-40921',
  operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
  abonado: '1002451',
  nombreCliente: 'María Pérez',
  telefono: '0412-118-4420',
  zona: 'Norte',
  canal: 'TELEGRAM',
  resultado: 'ESCALADO_NOC',
  fecha: '2026-07-17',
  hora: '10:42',
  duracionMin: 134,
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  modificadaFecha: null,
  modificadaHora: null,
  editor: null,
}

const editada: GestionRow = {
  ...gestion,
  modificadaFecha: '18/07/2026',
  modificadaHora: '11:47 a. m.',
  editor: { id: 'u-9', nombre: 'Lucía Márquez' },
}

describe('GestionDrawer', () => {
  beforeEach(() => {
    localStorage.clear()
    sesionCon('ADMIN')
  })

  it('no renderiza nada sin gestión seleccionada', () => {
    const { container } = render(<GestionDrawer gestion={null} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el detalle de la gestión seleccionada', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('LG-1002451')
    // `codigo`, derivado del id de BD, sigue sin pintarse
    expect(dialog).not.toHaveTextContent('LG-40921')
    expect(dialog).toHaveTextContent('Corte total de fibra')
    expect(dialog).toHaveTextContent('Ticket generado a NOC')
    expect(dialog).toHaveTextContent('Escalado a NOC')
  })

  it('no repite el abonado en la cabecera: solo vive en el campo del grid', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    // La cabecera (la que contiene el título del cliente) ya no lleva eyebrow.
    const cabecera = screen.getByRole('heading', { level: 2 }).parentElement
    expect(cabecera).not.toHaveTextContent('Abonado')
    expect(cabecera).not.toHaveTextContent('1002451')
    // El dato aparece una única vez, bajo su etiqueta del grid.
    expect(screen.getAllByText('LG-1002451')).toHaveLength(1)
    expect(screen.getByText('Abonado')).toBeInTheDocument()
  })

  it('identifica el drawer por el abonado, nunca por el código LG', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(
      screen.getByRole('dialog', {
        name: 'Detalle de gestión · Abonado LG-1002451',
      }),
    ).toBeInTheDocument()
  })

  it('titula el drawer con el nombre del cliente', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(
      screen.getByRole('heading', { name: 'María Pérez', level: 2 }),
    ).toBeInTheDocument()
  })

  it('muestra el identificador Fibex bajo la etiqueta Abonado', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(screen.getByText('Abonado')).toBeInTheDocument()
    expect(screen.getByText('LG-1002451')).toBeInTheDocument()
    expect(screen.queryByText('Ubicación')).toBeNull()
  })

  it('degrada a guion el cliente y el teléfono vacíos', () => {
    render(
      <GestionDrawer
        gestion={{ ...gestion, nombreCliente: '', telefono: '' }}
        onClose={vi.fn()}
      />,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('—')
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2)
  })

  it('no pinta Canal ni Duración: no se capturan en el formulario', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(screen.queryByText('Canal')).toBeNull()
    expect(screen.queryByText('TELEGRAM')).toBeNull()
    expect(screen.queryByText('Duración')).toBeNull()
    expect(screen.queryByText('2h 14m')).toBeNull()
  })

  it('ordena el grid en pares completos: cliente, atención y auditoría', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    const etiquetas = screen
      .getAllByText(
        /^(Abonado|Teléfono|Zona|Operador|Creada|Modificada|Detalle de la orden|Solución aplicada)$/,
      )
      .map((el) => el.textContent)
    expect(etiquetas).toEqual([
      'Abonado',
      'Teléfono',
      'Zona',
      'Operador',
      'Creada',
      'Modificada',
      'Detalle de la orden',
      'Solución aplicada',
    ])
  })

  it('cierra con el botón ×', async () => {
    const onClose = vi.fn()
    render(<GestionDrawer gestion={gestion} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar detalle' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('cierra con la tecla Escape', async () => {
    const onClose = vi.fn()
    render(<GestionDrawer gestion={gestion} onClose={onClose} />)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('cierra al pulsar el overlay', async () => {
    const onClose = vi.fn()
    render(<GestionDrawer gestion={gestion} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar overlay' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('no ofrece el botón "Ver abonado"', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Ver abonado/ })).toBeNull()
    expect(screen.queryByText(/Ver abonado/)).toBeNull()
  })

  it.each(['ADMIN', 'SUPERVISOR'] as const)(
    'muestra "Editar gestión" a %s y avisa al pulsarlo',
    async (role) => {
      sesionCon(role)
      const onEditar = vi.fn()
      render(
        <GestionDrawer gestion={gestion} onClose={vi.fn()} onEditar={onEditar} />,
      )
      await userEvent.click(
        screen.getByRole('button', { name: /Editar gestión/ }),
      )
      expect(onEditar).toHaveBeenCalledWith(gestion)
    },
  )

  it('etiqueta la fecha de creación como "Creada" y no muestra hora de creación', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(screen.getByText('Creada')).toBeInTheDocument()
    expect(screen.getByText('17/07/2026')).toBeInTheDocument()
    const dialog = screen.getByRole('dialog')
    expect(dialog).not.toHaveTextContent('10:42')
    expect(screen.queryByText('Hora')).toBeNull()
    expect(screen.queryByText('Fecha')).toBeNull()
  })

  it('muestra "Sin modificaciones" y omite "Modificada por" cuando nunca se editó', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(screen.getByText('Modificada')).toBeInTheDocument()
    expect(screen.getByText('Sin modificaciones')).toBeInTheDocument()
    // Sin edición no hay editor del que hablar: el campo ni se ofrece.
    expect(screen.queryByText('Modificada por')).toBeNull()
  })

  it('separa el sello de fecha y hora del nombre de quien editó', () => {
    render(<GestionDrawer gestion={editada} onClose={vi.fn()} />)
    const modificada = screen.getByText('Modificada').parentElement
    expect(modificada).toHaveTextContent('18/07/2026')
    expect(modificada).toHaveTextContent('11:47 a. m.')
    expect(modificada).not.toHaveTextContent('Lucía Márquez')
    expect(modificada).not.toHaveTextContent('·')

    const porQuien = screen.getByText('Modificada por').parentElement
    expect(porQuien).toHaveTextContent('Lucía Márquez')
    expect(porQuien).not.toHaveTextContent('18/07/2026')
    expect(porQuien).not.toHaveTextContent('11:47 a. m.')
    expect(screen.queryByText('Sin modificaciones')).toBeNull()
  })

  it('degrada a guion "Modificada por" cuando el editor fue eliminado', () => {
    render(
      <GestionDrawer gestion={{ ...editada, editor: null }} onClose={vi.fn()} />,
    )
    const modificada = screen.getByText('Modificada').parentElement
    expect(modificada).toHaveTextContent('18/07/2026')
    expect(modificada).toHaveTextContent('11:47 a. m.')

    const porQuien = screen.getByText('Modificada por').parentElement
    expect(porQuien).toHaveTextContent('—')
    expect(porQuien).not.toHaveTextContent('null')
    expect(screen.queryByText('Sin modificaciones')).toBeNull()
  })

  it('oculta "Editar gestión" al OPERADOR', () => {
    sesionCon('OPERADOR')
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} onEditar={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /Editar gestión/ })).toBeNull()
  })
})
