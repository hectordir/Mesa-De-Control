import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('renderiza su contenido', () => {
    render(<Badge>Abierto</Badge>)
    expect(screen.getByText('Abierto')).toBeInTheDocument()
  })

  it('tone="success" aplica la clase de token success', () => {
    render(<Badge tone="success">Resuelto</Badge>)
    expect(screen.getByText('Resuelto')).toHaveClass('text-success')
  })

  it('aplica la clase de token de cada tono', () => {
    render(
      <>
        <Badge tone="warning">Pendiente</Badge>
        <Badge tone="danger">Crítico</Badge>
        <Badge tone="info">Info</Badge>
        <Badge tone="neutral">Neutro</Badge>
      </>,
    )
    expect(screen.getByText('Pendiente')).toHaveClass('text-warning')
    expect(screen.getByText('Crítico')).toHaveClass('text-danger')
    expect(screen.getByText('Info')).toHaveClass('text-info')
    expect(screen.getByText('Neutro')).toHaveClass('text-neutral')
  })

  it('tone="brand" usa los tokens de marca con fondo y borde suaves', () => {
    render(<Badge tone="brand">Acceso restringido</Badge>)
    const badge = screen.getByText('Acceso restringido')
    expect(badge).toHaveClass('text-brand')
    expect(badge).toHaveClass('bg-brand-soft')
    expect(badge).toHaveClass('border-brand-outline')
  })

  it('usa el radio de chip y el tono neutral por defecto', () => {
    render(<Badge>Sin tono</Badge>)
    const badge = screen.getByText('Sin tono')
    expect(badge).toHaveClass('rounded-chip')
    expect(badge).toHaveClass('text-neutral')
  })
})
