import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HistorialCards } from './HistorialCards'
import type { GestionRow } from '../../../lib/api/types'

const fila = (over: Partial<GestionRow> = {}): GestionRow => ({
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
  ...over,
})

describe('HistorialCards', () => {
  it('muestra el abonado Fibex prefijado y el nombre del cliente', () => {
    render(<HistorialCards rows={[fila({ codigo: 'LG-40921' })]} onOpenRow={vi.fn()} />)
    expect(screen.getByText('LG-1002451')).toBeInTheDocument()
    expect(screen.getByText('María Pérez')).toBeInTheDocument()
    // `codigo`, derivado del id de BD, sigue sin pintarse
    expect(screen.queryByText('LG-40921')).not.toBeInTheDocument()
  })

  it('degrada a guion el cliente vacío', () => {
    render(<HistorialCards rows={[fila({ nombreCliente: '' })]} onOpenRow={vi.fn()} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('al pulsar la tarjeta dispara onOpenRow con esa gestión', async () => {
    const onOpenRow = vi.fn()
    const row = fila()
    render(<HistorialCards rows={[row]} onOpenRow={onOpenRow} />)
    await userEvent.click(screen.getByText('María Pérez'))
    expect(onOpenRow).toHaveBeenCalledWith(row)
  })
})
