import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiSaludGrilla } from './KpiSaludGrilla'

describe('KpiSaludGrilla', () => {
  it('muestra el porcentaje, los operativos y el anillo', () => {
    render(<KpiSaludGrilla saludGrilla={96} operativos={159} />)
    const grupo = screen.getByRole('group', { name: 'Salud de Grilla' })
    expect(grupo).toHaveTextContent('96%')
    expect(grupo).toHaveTextContent('159 operativos')
    expect(
      screen.getByRole('img', { name: 'Salud de la grilla 96%' }),
    ).toBeInTheDocument()
  })

  it('colorea en verde y marca ✓ cuando la salud es 100%', () => {
    render(<KpiSaludGrilla saludGrilla={100} operativos={165} />)
    const valor = screen.getByText('100%')
    expect(valor).toHaveClass('text-success')
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('colorea en ámbar cuando la salud es ≥90% pero <100%', () => {
    render(<KpiSaludGrilla saludGrilla={94} operativos={155} />)
    expect(screen.getByText('94%')).toHaveClass('text-warning')
    expect(screen.getByText('!')).toBeInTheDocument()
  })

  it('colorea en rojo cuando la salud cae por debajo de 90%', () => {
    render(<KpiSaludGrilla saludGrilla={82} operativos={135} />)
    expect(screen.getByText('82%')).toHaveClass('text-danger')
  })
})
