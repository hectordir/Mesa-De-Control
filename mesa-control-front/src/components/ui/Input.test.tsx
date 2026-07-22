import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('asocia el label con el control', () => {
    render(<Input label="Correo" />)
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
  })

  it('permite escribir y reenvía props nativas', async () => {
    render(<Input label="Buscar" placeholder="folio" />)
    const input = screen.getByLabelText('Buscar')
    await userEvent.type(input, 'F-102')
    expect(input).toHaveValue('F-102')
    expect(input).toHaveAttribute('placeholder', 'folio')
  })

  it('expone el error con role="alert" y marca el control como inválido', () => {
    render(<Input label="Correo" error="Correo inválido" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Correo inválido')
    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Correo inválido')
  })

  it('sin error no hay alerta ni aria-invalid', () => {
    render(<Input label="Correo" />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).not.toHaveAttribute('aria-invalid')
  })

  it('usa el radio de control del sistema de diseño', () => {
    render(<Input label="Correo" />)
    expect(screen.getByLabelText('Correo')).toHaveClass('rounded-control')
  })

  it('permite personalizar las clases del label y del contenedor', () => {
    render(
      <Input
        label="Correo"
        labelClassName="text-text-secondary"
        wrapperClassName="gap-2"
      />,
    )
    expect(screen.getByText('Correo')).toHaveClass('text-text-secondary')
    expect(screen.getByLabelText('Correo').parentElement).toHaveClass('gap-2')
  })

  it('renderiza un icono decorativo a la izquierda y desplaza el padding', () => {
    render(
      <Input
        label="Correo"
        leadingIcon={<svg data-testid="icono" aria-hidden="true" />}
      />,
    )
    expect(screen.getByTestId('icono')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toHaveClass('pl-[42px]')
  })

  it('la talla sm compacta el control y su icono', () => {
    render(
      <Input
        label="Buscar"
        inputSize="sm"
        leadingIcon={<svg data-testid="icono" aria-hidden="true" />}
      />,
    )
    const input = screen.getByLabelText('Buscar')
    expect(input).toHaveClass('pl-[30px]')
    expect(input).toHaveClass('text-caption')
    expect(input).not.toHaveClass('pl-[42px]')
  })

  it('el tono inset apoya el campo sobre el fondo, no sobre la superficie', () => {
    render(<Input label="Buscar" tone="inset" />)
    const input = screen.getByLabelText('Buscar')
    expect(input).toHaveClass('bg-bg')
    expect(input).not.toHaveClass('bg-surface')
  })

  it('funciona sin label usando aria-label', () => {
    render(<Input aria-label="Filtro" />)
    expect(screen.getByLabelText('Filtro')).toBeInTheDocument()
  })
})
