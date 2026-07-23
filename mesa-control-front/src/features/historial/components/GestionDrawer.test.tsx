import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { GestionDrawer } from './GestionDrawer'
import type { GestionRow } from '../../../lib/api/types'

const gestion: GestionRow = {
  id: 'clx1',
  codigo: 'GST-40921',
  operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
  abonado: 'Cond. Los Robles',
  telefono: '0412-118-4420',
  zona: 'Norte',
  canal: 'TELEGRAM',
  resultado: 'ESCALADO_NOC',
  fecha: '2026-07-17',
  hora: '10:42',
  duracionMin: 134,
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
}

describe('GestionDrawer', () => {
  it('no renderiza nada sin gestión seleccionada', () => {
    const { container } = render(<GestionDrawer gestion={null} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el detalle de la gestión seleccionada', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('GST-40921')
    expect(dialog).toHaveTextContent('Cond. Los Robles')
    expect(dialog).toHaveTextContent('Corte total de fibra')
    expect(dialog).toHaveTextContent('Ticket generado a NOC')
    expect(dialog).toHaveTextContent('Escalado a NOC')
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

  it('ofrece los botones futuros sin acción', () => {
    render(<GestionDrawer gestion={gestion} onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Editar gestión/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ver abonado/ })).toBeInTheDocument()
  })
})
