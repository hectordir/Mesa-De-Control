import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DatePickerPopover } from './DatePickerPopover'

function renderPopover(
  props: Partial<React.ComponentProps<typeof DatePickerPopover>> = {},
) {
  const onChange = props.onChange ?? vi.fn()
  render(
    <DatePickerPopover
      value="2026-07-15"
      onChange={onChange}
      dialogLabel="Fecha"
      {...props}
    >
      {({ open, toggle }) => (
        <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={toggle}>
          Abrir
        </button>
      )}
    </DatePickerPopover>,
  )
  return { onChange, trigger: screen.getByRole('button', { name: 'Abrir' }) }
}

describe('DatePickerPopover', () => {
  it('mantiene el calendario cerrado hasta que el disparador lo abre', async () => {
    const user = userEvent.setup()
    const { trigger } = renderPopover()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(trigger)

    expect(screen.getByRole('dialog', { name: 'Fecha' })).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('elegir un día emite YYYY-MM-DD y cierra el popover', async () => {
    const user = userEvent.setup()
    const { trigger, onChange } = renderPopover()

    await user.click(trigger)
    await user.click(await screen.findByRole('button', { name: /22/ }))

    expect(onChange).toHaveBeenCalledWith('2026-07-22')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cierra al hacer clic fuera', async () => {
    const user = userEvent.setup()
    const { trigger } = renderPopover()

    await user.click(trigger)
    await user.click(document.body)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cierra con Escape', async () => {
    const user = userEvent.setup()
    const { trigger } = renderPopover()

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('ancla el popover a la izquierda por defecto', async () => {
    const user = userEvent.setup()
    const { trigger } = renderPopover()

    await user.click(trigger)

    expect(screen.getByRole('dialog')).toHaveClass('left-0')
  })

  it('con align="right" el popover se ancla por la derecha', async () => {
    const user = userEvent.setup()
    const { trigger } = renderPopover({ align: 'right' })

    await user.click(trigger)

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('right-0')
    expect(dialog).not.toHaveClass('left-0')
  })

  describe('está en español', () => {
    it('rotula la cabecera con el mes y el año', async () => {
      const user = userEvent.setup()
      const { trigger } = renderPopover()

      await user.click(trigger)

      expect(screen.getByText('julio 2026')).toBeInTheDocument()
      expect(screen.getByRole('grid')).toHaveAccessibleName('julio 2026')
    })

    it('rotula los días de la semana', async () => {
      const user = userEvent.setup()
      const { trigger } = renderPopover()

      await user.click(trigger)

      const lunes = screen.getByText('lu')
      expect(lunes).toBeInTheDocument()
      expect(lunes).toHaveAttribute('aria-label', 'lunes')
      expect(screen.getByText('mi')).toHaveAttribute('aria-label', 'miércoles')
      expect(screen.getByText('sá')).toHaveAttribute('aria-label', 'sábado')
    })

    it('rotula los botones de navegación', async () => {
      const user = userEvent.setup()
      const { trigger } = renderPopover()

      await user.click(trigger)

      expect(
        screen.getByRole('button', { name: 'Ir al mes anterior' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: 'Ir al mes siguiente' }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /month/i })).toBeNull()
    })

    it('rotula cada día con su fecha larga y marca el seleccionado', async () => {
      const user = userEvent.setup()
      const { trigger } = renderPopover()

      await user.click(trigger)

      expect(
        screen.getByRole('button', { name: 'miércoles, 22 de julio de 2026' }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', {
          name: 'miércoles, 15 de julio de 2026, seleccionado',
        }),
      ).toBeInTheDocument()
    })

    it('navegar al mes anterior actualiza la cabecera en español', async () => {
      const user = userEvent.setup()
      const { trigger } = renderPopover()

      await user.click(trigger)
      await user.click(screen.getByRole('button', { name: 'Ir al mes anterior' }))

      expect(screen.getByText('junio 2026')).toBeInTheDocument()
    })
  })

  it('no permite elegir los días marcados como deshabilitados', async () => {
    const user = userEvent.setup()
    const { trigger, onChange } = renderPopover({
      disabled: { after: new Date(2026, 6, 17) },
    })

    await user.click(trigger)
    const dia22 = await screen.findByRole('button', { name: /22/ })

    expect(dia22).toBeDisabled()
    await user.click(dia22)
    expect(onChange).not.toHaveBeenCalled()
  })
})
