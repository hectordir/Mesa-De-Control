import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthFooter } from './AuthFooter'

describe('AuthFooter', () => {
  it('muestra las dos líneas del pie', () => {
    render(<AuthFooter />)
    expect(
      screen.getByText('Conexión encriptada · extremo a extremo'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Mesa de control v2.1 · Fibex Telecom'),
    ).toBeInTheDocument()
  })

  it('el punto de estado usa el token info y es decorativo', () => {
    render(<AuthFooter />)
    const dot = screen.getByTestId('secure-dot')
    expect(dot).toHaveClass('bg-info')
    expect(dot).toHaveAttribute('aria-hidden', 'true')
  })
})
