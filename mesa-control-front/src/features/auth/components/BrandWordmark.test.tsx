import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BrandWordmark } from './BrandWordmark'

describe('BrandWordmark', () => {
  it('muestra las dos líneas de la marca', () => {
    render(<BrandWordmark />)
    expect(screen.getByText('FIBEX')).toBeInTheDocument()
    expect(screen.getByText('CONTROL')).toBeInTheDocument()
  })

  it('expone un nombre accesible único para la marca', () => {
    render(<BrandWordmark />)
    expect(screen.getByRole('img', { name: 'Fibex Control' })).toBeInTheDocument()
  })

  it('colorea cada línea con su token', () => {
    render(<BrandWordmark />)
    expect(screen.getByText('FIBEX')).toHaveClass('text-text-primary')
    expect(screen.getByText('CONTROL')).toHaveClass('text-brand')
  })
})
