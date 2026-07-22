import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DateField } from './DateField'

describe('DateField', () => {
  it('muestra la fecha seleccionada en el disparador', () => {
    render(<DateField label="Fecha de la Gestión" value="2026-07-15" onChange={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: /Fecha de la Gestión/ })
    expect(trigger).toHaveTextContent('15')
  })

  it('al elegir un día en el calendario emite YYYY-MM-DD', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<DateField label="Fecha de la Gestión" value="2026-07-15" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /Fecha de la Gestión/ }))
    // el calendario del mes de julio 2026 está visible
    const dia = await screen.findByRole('button', { name: /22/ })
    await user.click(dia)

    expect(onChange).toHaveBeenCalledWith('2026-07-22')
  })

  it('el calendario se abre y cierra desde el disparador', async () => {
    const user = userEvent.setup()
    render(<DateField label="Fecha de la Gestión" value="2026-07-15" onChange={vi.fn()} />)
    const trigger = screen.getByRole('button', { name: /Fecha de la Gestión/ })

    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    await user.click(trigger)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })
})
