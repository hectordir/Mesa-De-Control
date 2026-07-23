import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { FibexPlayToggle } from './FibexPlayToggle'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FibexPlayToggle />
    </MemoryRouter>,
  )
}

describe('FibexPlayToggle', () => {
  it('ofrece los dos enlaces de la sección Fibex Play', () => {
    renderAt('/fibex-play')
    expect(
      screen.getByRole('link', { name: /Grilla en Vivo/i }),
    ).toHaveAttribute('href', '/fibex-play')
    expect(
      screen.getByRole('link', { name: /Gestión de Clientes/i }),
    ).toHaveAttribute('href', '/fibex-play/gestion')
  })

  it('marca activa la Grilla en /fibex-play', () => {
    renderAt('/fibex-play')
    expect(screen.getByRole('link', { name: /Grilla en Vivo/i })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(
      screen.getByRole('link', { name: /Gestión de Clientes/i }),
    ).not.toHaveAttribute('aria-current', 'page')
  })

  it('marca activa Gestión de Clientes en /fibex-play/gestion', () => {
    renderAt('/fibex-play/gestion')
    expect(
      screen.getByRole('link', { name: /Gestión de Clientes/i }),
    ).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('link', { name: /Grilla en Vivo/i }),
    ).not.toHaveAttribute('aria-current', 'page')
  })
})
