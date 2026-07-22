import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza su contenido como botón accesible', () => {
    render(<Button>Nueva gestión</Button>)
    expect(
      screen.getByRole('button', { name: 'Nueva gestión' }),
    ).toBeInTheDocument()
  })

  it('dispara onClick al pulsarlo', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Guardar</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('usa la variante primary por defecto con el color de marca', () => {
    render(<Button>Aceptar</Button>)
    const button = screen.getByRole('button', { name: 'Aceptar' })
    expect(button).toHaveClass('bg-brand')
    expect(button).toHaveClass('text-brand-fg')
  })

  it('aplica clases de token distintas por variante', () => {
    render(
      <>
        <Button variant="secondary">Sec</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </>,
    )
    expect(screen.getByRole('button', { name: 'Sec' })).toHaveClass('bg-surface')
    expect(screen.getByRole('button', { name: 'Ghost' })).toHaveClass(
      'bg-transparent',
    )
    expect(screen.getByRole('button', { name: 'Danger' })).toHaveClass(
      'bg-danger',
    )
  })

  it('soporta el tamaño sm y reenvía props nativas de button', () => {
    render(
      <Button size="sm" type="submit" disabled>
        Enviar
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Enviar' })
    expect(button).toHaveClass('text-caption')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toBeDisabled()
  })

  it('no dispara onClick cuando está deshabilitado', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Bloqueado
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Bloqueado' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
