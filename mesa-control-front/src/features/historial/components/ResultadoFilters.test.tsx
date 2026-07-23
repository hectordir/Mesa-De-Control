import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ResultadoFilters } from './ResultadoFilters'
import type { ResultadoGestion } from '../../../lib/api/types'

const counts = {
  total: 248,
  porResultado: {
    SOLUCIONADO_MESA: 120,
    ENVIADO_SOPORTE2: 44,
    ESCALADO_NOC: 84,
    PENDIENTE_CLIENTE: 0,
    REAGENDADO: 0,
  },
}

function setup(activo: ResultadoGestion | null = null) {
  const onChange = vi.fn()
  render(
    <ResultadoFilters counts={counts} activo={activo} onChange={onChange} />,
  )
  return { onChange }
}

describe('ResultadoFilters', () => {
  it('muestra la chip Todos con el total y una chip por resultado con su contador', () => {
    setup()
    const todos = screen.getByRole('button', { name: /Todos/ })
    expect(todos).toHaveTextContent('248')
    expect(screen.getByRole('button', { name: /Solucionado en Mesa/ })).toHaveTextContent('120')
    expect(screen.getByRole('button', { name: /Escalado a NOC/ })).toHaveTextContent('84')
    // resultado sin gestiones se muestra con 0
    expect(screen.getByRole('button', { name: /Reagendado/ })).toHaveTextContent('0')
  })

  it('al pulsar una chip de resultado dispara onChange con ese valor de enum', async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: /Escalado a NOC/ }))
    expect(onChange).toHaveBeenCalledWith('ESCALADO_NOC')
  })

  it('al pulsar Todos dispara onChange con null', async () => {
    const { onChange } = setup('ESCALADO_NOC')
    await userEvent.click(screen.getByRole('button', { name: /Todos/ }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('marca la chip activa con aria-pressed', () => {
    setup('ESCALADO_NOC')
    expect(screen.getByRole('button', { name: /Escalado a NOC/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: /Todos/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
