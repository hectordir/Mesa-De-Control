import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renderiza header y body como contenido visible', () => {
    render(
      <Card>
        <Card.Header>Tickets activos</Card.Header>
        <Card.Body>1.284 en cola</Card.Body>
      </Card>,
    )
    expect(screen.getByText('Tickets activos')).toBeInTheDocument()
    expect(screen.getByText('1.284 en cola')).toBeInTheDocument()
  })

  it('usa la superficie, borde, radio y elevación del sistema de diseño', () => {
    render(<Card data-testid="card">contenido</Card>)
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('bg-surface')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('border-border')
    expect(card).toHaveClass('rounded-card')
    expect(card).toHaveClass('shadow-elevation')
  })

  it('permite añadir clases propias sin perder las del token', () => {
    render(
      <Card className="w-full" data-testid="card">
        contenido
      </Card>,
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('w-full')
    expect(card).toHaveClass('bg-surface')
  })
})
