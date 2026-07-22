import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AuthLayout } from './AuthLayout'

describe('AuthLayout', () => {
  it('renderiza a sus hijos centrados sobre el overlay de tokens', () => {
    render(
      <AuthLayout>
        <p>contenido</p>
      </AuthLayout>,
    )
    expect(screen.getByText('contenido')).toBeInTheDocument()
    expect(screen.getByTestId('auth-overlay')).toHaveClass('bg-auth-overlay')
  })

  it('sin backgroundUrl no pinta ninguna imagen de fondo', () => {
    render(<AuthLayout>x</AuthLayout>)
    expect(screen.getByTestId('auth-background')).not.toHaveStyle({
      backgroundImage: 'url(/noc.jpg)',
    })
  })

  it('con backgroundUrl usa la imagen recibida', () => {
    render(<AuthLayout backgroundUrl="/noc.jpg">x</AuthLayout>)
    expect(screen.getByTestId('auth-background')).toHaveStyle({
      backgroundImage: 'url(/noc.jpg)',
    })
  })
})
