import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from './StatCard'

describe('StatCard', () => {
  it('muestra label y value', () => {
    render(<StatCard label="Tickets activos" value="1.284" />)
    expect(screen.getByText('Tickets activos')).toBeInTheDocument()
    expect(screen.getByText('1.284')).toBeInTheDocument()
  })

  it('muestra el hint solo cuando se pasa', () => {
    const { rerender } = render(<StatCard label="SLA" value="98%" />)
    expect(screen.queryByText('+2% vs ayer')).not.toBeInTheDocument()
    rerender(<StatCard label="SLA" value="98%" hint="+2% vs ayer" />)
    expect(screen.getByText('+2% vs ayer')).toBeInTheDocument()
  })

  it('aplica la tipografía de token al label y al valor', () => {
    render(<StatCard label="Abiertos" value={42} />)
    const label = screen.getByText('Abiertos')
    expect(label).toHaveClass('text-label')
    expect(label).toHaveClass('uppercase')
    expect(label).toHaveClass('text-text-muted')
    expect(screen.getByText('42')).toHaveClass('text-display')
  })
})
