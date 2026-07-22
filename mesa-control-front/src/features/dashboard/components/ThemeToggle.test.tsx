import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  })

  it('alterna data-theme en <html> entre dark y light', async () => {
    render(<ThemeToggle />)
    const toggle = screen.getByRole('button', { name: /tema claro/i })

    await userEvent.click(toggle)
    expect(document.documentElement.dataset.theme).toBe('light')

    await userEvent.click(screen.getByRole('button', { name: /tema oscuro/i }))
    expect(document.documentElement.dataset.theme).toBe('dark')
  })

  it('refleja el estado actual con aria-pressed', async () => {
    render(<ThemeToggle />)
    const toggle = screen.getByRole('button', { name: /tema/i })

    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: /tema/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
