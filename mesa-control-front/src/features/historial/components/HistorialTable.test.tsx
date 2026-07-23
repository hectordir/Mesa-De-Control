import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HistorialTable } from './HistorialTable'
import type { GestionRow } from '../../../lib/api/types'

const filas: GestionRow[] = [
  {
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
  },
  {
    id: 'clx2',
    codigo: 'GST-40922',
    operador: { id: 'op-2', nombre: 'Keyla Gómez', iniciales: 'KG' },
    abonado: 'Res. El Sol',
    telefono: '0414-000-1111',
    zona: 'Sur',
    canal: 'LLAMADA',
    resultado: 'SOLUCIONADO_MESA',
    fecha: '2026-07-16',
    hora: '09:10',
    duracionMin: null,
    detalle: 'Internet lento',
    solucion: 'Reinicio de ONT',
  },
]

function setup(over: Partial<React.ComponentProps<typeof HistorialTable>> = {}) {
  const onSort = vi.fn()
  const onOpenRow = vi.fn()
  render(
    <HistorialTable
      rows={filas}
      sortKey="fecha"
      sortDir="desc"
      onSort={onSort}
      onOpenRow={onOpenRow}
      {...over}
    />,
  )
  return { onSort, onOpenRow }
}

describe('HistorialTable', () => {
  it('renderiza una fila por gestión con sus datos clave', () => {
    setup()
    expect(screen.getByText('GST-40921')).toBeInTheDocument()
    expect(screen.getByText('Cond. Los Robles')).toBeInTheDocument()
    expect(screen.getByText('Res. El Sol')).toBeInTheDocument()
    // etiqueta legible del resultado
    expect(screen.getByText('Escalado a NOC')).toBeInTheDocument()
  })

  it('al pulsar el encabezado de una columna ordenable dispara onSort con su clave', async () => {
    const { onSort } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Operador/ }))
    expect(onSort).toHaveBeenCalledWith('operador')
  })

  it('muestra la flecha de dirección en la columna activa y ↕ en el resto', () => {
    setup({ sortKey: 'fecha', sortDir: 'desc' })
    const fecha = screen.getByRole('button', { name: /Fecha/ })
    expect(fecha).toHaveTextContent('▼')
    expect(fecha).toHaveAttribute('aria-sort', 'descending')
    const operador = screen.getByRole('button', { name: /Operador/ })
    expect(operador).toHaveTextContent('↕')
  })

  it('al pulsar una fila dispara onOpenRow con esa gestión', async () => {
    const { onOpenRow } = setup()
    const fila = screen.getByRole('row', { name: /Cond. Los Robles/ })
    await userEvent.click(within(fila).getByText('Cond. Los Robles'))
    expect(onOpenRow).toHaveBeenCalledWith(filas[0])
  })
})
