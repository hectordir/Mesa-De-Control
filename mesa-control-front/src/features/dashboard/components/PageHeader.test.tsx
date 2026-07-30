import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'

function renderHeader(
  path: string,
  titulo: string,
  subtitulo: string,
  control: React.ReactNode,
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <PageHeader titulo={titulo} subtitulo={subtitulo}>
        {control}
      </PageHeader>
    </MemoryRouter>,
  )
}

describe('PageHeader', () => {
  it('muestra título, subtítulo, el toggle y el control recibido', () => {
    renderHeader('/dashboard', 'Monitor Diario', 'Vista operativa · hoy', (
      <button type="button">Control</button>
    ))

    expect(
      screen.getByRole('heading', { name: 'Monitor Diario', level: 1 }),
    ).toBeInTheDocument()
    expect(screen.getByText('Vista operativa · hoy')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Vista del dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Control' })).toBeInTheDocument()
  })

  it('reserva el mismo ancho para el control en ambas vistas', () => {
    const diario = renderHeader('/dashboard', 'Monitor Diario', 'sub largo', (
      <span>fecha</span>
    ))
    const clasesDiario = screen.getByTestId('header-control').className
    diario.unmount()

    renderHeader(
      '/dashboard/analisis-mensual',
      'Análisis Mensual',
      'otro subtítulo bastante más largo que el anterior',
      <span>mes</span>,
    )
    const clasesMensual = screen.getByTestId('header-control').className

    expect(clasesMensual).toBe(clasesDiario)
    expect(clasesMensual).toMatch(/min-w-\[/)
  })

  it('reserva ancho para el control más ancho (filtro mensual + volver al mes actual)', () => {
    renderHeader('/dashboard', 'Monitor Diario', 'sub', <span>fecha</span>)

    const ancho = screen
      .getByTestId('header-control')
      .className.match(/min-w-\[(\d+)px\]/)

    expect(ancho, 'el ancho reservado debe declararse en px').not.toBeNull()
    // El filtro mensual con "Volver al mes actual" mide ~460px con el mes más
    // largo ("Septiembre 2026"); por debajo de eso el toggle se desplazaría.
    expect(Number(ancho?.[1])).toBeGreaterThanOrEqual(480)
  })
})
