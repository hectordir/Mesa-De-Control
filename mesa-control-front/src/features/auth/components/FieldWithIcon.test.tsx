import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FieldWithIcon } from './FieldWithIcon'

describe('FieldWithIcon', () => {
  it('asocia label e input y muestra el icono indicado', () => {
    render(<FieldWithIcon label="Correo" icon="mail" name="email" />)
    const input = screen.getByLabelText('Correo')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('name', 'email')
    expect(screen.getByTestId('icon-mail')).toBeInTheDocument()
  })

  it('el icono es decorativo (aria-hidden)', () => {
    render(<FieldWithIcon label="Contraseña" icon="lock" name="password" />)
    expect(screen.getByTestId('icon-lock')).toHaveAttribute('aria-hidden', 'true')
  })

  it('reenvía props nativas y permite escribir', async () => {
    render(
      <FieldWithIcon
        label="Correo"
        icon="mail"
        name="email"
        type="email"
        placeholder="operador@fibex.com"
      />,
    )
    const input = screen.getByLabelText('Correo')
    expect(input).toHaveAttribute('placeholder', 'operador@fibex.com')
    await userEvent.type(input, 'a@b.com')
    expect(input).toHaveValue('a@b.com')
  })

  it('propaga el error del campo', () => {
    render(
      <FieldWithIcon
        label="Correo"
        icon="mail"
        name="email"
        error="Introduce un correo válido"
      />,
    )
    expect(screen.getByLabelText('Correo')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.getByText('Introduce un correo válido')).toBeInTheDocument()
  })
})
