import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HistorialTable } from './HistorialTable'
import type { GestionRow } from '../../../lib/api/types'

const filas: GestionRow[] = [
  {
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
  },
  {
    id: 'clx2',
    codigo: 'LG-40922',
    operador: { id: 'op-2', nombre: 'Keyla Gómez', iniciales: 'KG' },
    abonado: '1002452',
    nombreCliente: 'Luis Ramírez',
    telefono: '0414-000-1111',
    zona: 'Sur',
    canal: 'LLAMADA',
    resultado: 'SOLUCIONADO_MESA',
    fecha: '2026-07-16',
    hora: '09:10',
    duracionMin: null,
    detalle: 'Internet lento',
    solucion: 'Reinicio de ONT',
    modificadaFecha: null,
    modificadaHora: null,
    editor: null,
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
    expect(screen.getByText('LG-1002451')).toBeInTheDocument()
    expect(screen.getByText('María Pérez')).toBeInTheDocument()
    expect(screen.getByText('Luis Ramírez')).toBeInTheDocument()
    // etiqueta legible del resultado
    expect(screen.getByText('Escalado a NOC')).toBeInTheDocument()
  })

  it('la primera columna es Abonado (identificador Fibex) y la tercera Cliente', () => {
    setup()
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent ?? '')
    expect(headers[0]).toContain('Abonado')
    expect(headers[2]).toContain('Cliente')

    const fila = screen.getByRole('row', { name: /María Pérez/ })
    const celdas = within(fila).getAllByRole('cell')
    expect(celdas[0]).toHaveTextContent('LG-1002451')
    expect(celdas[2]).toHaveTextContent('María Pérez')
  })

  it('pinta el abonado con el prefijo LG-, nunca el código derivado del id', () => {
    setup()
    expect(screen.getByText('LG-1002451')).toBeInTheDocument()
    expect(screen.getByText('LG-1002452')).toBeInTheDocument()
    // `codigo` (LG-40921/LG-40922, derivado del id de BD) sigue sin pintarse
    expect(screen.queryByText('LG-40921')).not.toBeInTheDocument()
    expect(screen.queryByText('LG-40922')).not.toBeInTheDocument()
  })

  it('muestra un guion cuando el cliente o el teléfono vienen vacíos', () => {
    setup({ rows: [{ ...filas[0], nombreCliente: '', telefono: '' }] })
    const fila = screen.getByRole('row', { name: /1002451/ })
    const celdas = within(fila).getAllByRole('cell')
    expect(celdas[2]).toHaveTextContent('—')
    expect(celdas[3]).toHaveTextContent('—')
  })

  it('al pulsar el encabezado de una columna ordenable dispara onSort con su clave', async () => {
    const { onSort } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Operador/ }))
    expect(onSort).toHaveBeenCalledWith('operador')
  })

  it('la cabecera Cliente ordena por nombreCliente', async () => {
    const { onSort } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Cliente/ }))
    expect(onSort).toHaveBeenCalledWith('nombreCliente')
  })

  it('la cabecera Abonado ordena por abonado (sortKey aceptado por el back)', async () => {
    const { onSort } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Abonado/ }))
    expect(onSort).toHaveBeenCalledWith('abonado')
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
    const fila = screen.getByRole('row', { name: /María Pérez/ })
    await userEvent.click(within(fila).getByText('María Pérez'))
    expect(onOpenRow).toHaveBeenCalledWith(filas[0])
  })
})
