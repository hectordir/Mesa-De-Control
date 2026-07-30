import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ANCHO_SEGMENTO, DashboardViewToggle } from './DashboardViewToggle'

function renderToggle(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DashboardViewToggle />
    </MemoryRouter>,
  )
}

const RUTAS = ['/dashboard', '/dashboard/analisis-mensual'] as const

describe('DashboardViewToggle', () => {
  it('reserva el mismo ancho en ambos segmentos y en ambas rutas', () => {
    for (const ruta of RUTAS) {
      const { unmount } = renderToggle(ruta)
      const segmentos = screen.getAllByRole('link')

      expect(segmentos).toHaveLength(2)
      for (const segmento of segmentos) {
        expect(segmento).toHaveClass(ANCHO_SEGMENTO)
      }
      unmount()
    }
  })

  it('mantiene el hueco del punto activo en los dos segmentos', () => {
    renderToggle('/dashboard')
    const [diario, mensual] = screen.getAllByRole('link')

    // el punto existe en el DOM de ambos: sólo cambia su visibilidad
    expect(diario.querySelector('[data-testid="punto-vista"]')).toBeInTheDocument()
    expect(mensual.querySelector('[data-testid="punto-vista"]')).toBeInTheDocument()

    expect(diario.querySelector('[data-testid="punto-vista"]')).not.toHaveClass(
      'invisible',
    )
    expect(mensual.querySelector('[data-testid="punto-vista"]')).toHaveClass(
      'invisible',
    )
  })

  it('marca como activa la vista de la ruta actual', () => {
    renderToggle('/dashboard/analisis-mensual')
    expect(screen.getByRole('link', { name: /Análisis Mensual/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('link', { name: 'Monitor Diario' }),
    ).not.toHaveAttribute('aria-current')
  })
})
