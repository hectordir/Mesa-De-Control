import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import DashboardPage from './DashboardPage'

describe('DashboardPage (consola NOC)', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  })

  it('muestra el título de la mesa de control', () => {
    render(<DashboardPage />)
    expect(
      screen.getByRole('heading', { name: 'Mesa de Control', level: 1 }),
    ).toBeInTheDocument()
  })

  it('muestra los cuatro KPI con su pista', () => {
    render(<DashboardPage />)
    for (const label of [
      'Tickets activos',
      'En espera',
      'Resueltos hoy',
      'SLA en riesgo',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('renderiza la tabla de gestiones con cabecera y seis filas', () => {
    render(<DashboardPage />)
    const table = screen.getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(7)
    for (const col of ['ID', 'Cliente', 'Zona', 'Estado', 'Asignado']) {
      expect(within(table).getByRole('columnheader', { name: col })).toBeInTheDocument()
    }
  })

  it('muestra el texto de cada badge de estado', () => {
    render(<DashboardPage />)
    const table = screen.getByRole('table')
    for (const estado of [
      'Resuelto',
      'Pendiente',
      'Crítico',
      'En proceso',
      'Cerrado',
      'Escalado',
    ]) {
      expect(within(table).getByText(estado)).toBeInTheDocument()
    }
  })

  it('muestra la distribución por categoría con cinco barras', () => {
    render(<DashboardPage />)
    const panel = screen.getByRole('region', { name: /distribución por categoría/i })
    expect(within(panel).getAllByRole('meter')).toHaveLength(5)
  })

  it('muestra la barra de acciones con las cuatro variantes y el buscador', () => {
    render(<DashboardPage />)
    for (const name of ['Nueva gestión', 'Exportar', 'Filtros', 'Cerrar turno']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Buscar gestión')).toBeInTheDocument()
  })

  it('alterna data-theme en <html> entre dark y light', async () => {
    render(<DashboardPage />)
    const toggle = screen.getByRole('button', { name: /tema/i })

    expect(document.documentElement.dataset.theme).toBe('dark')
    await userEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('light')
    await userEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
