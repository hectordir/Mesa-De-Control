import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MonthFilter } from './MonthFilter'
import { etiquetaMes, type MonthFilterState } from '../hooks/useMonthFilter'
import { hoyISO } from '../hooks/useOperationDay'
import { useDashboardDateStore } from '../../../stores/dashboardDate.store'

function mesFalso(periodo: string, esMesActual: boolean): MonthFilterState {
  return {
    periodo,
    etiqueta: etiquetaMes(periodo),
    opciones: [
      { value: '2026-05', label: 'Mayo 2026' },
      { value: '2026-02', label: 'Febrero 2026' },
    ],
    esMesActual,
    setPeriodo: vi.fn(),
    volverAlMesActual: vi.fn(),
  }
}

const boton = () => screen.getByRole('button', { name: /volver al mes actual/i })

describe('MonthFilter', () => {
  // El componente recibe su estado por props, pero la fecha del dashboard es un
  // store global: se restablece para no depender del orden de ejecución.
  beforeEach(() => {
    useDashboardDateStore.setState({ fecha: hoyISO() })
  })

  it('muestra la etiqueta del mes consultado en el chip', () => {
    render(<MonthFilter mes={mesFalso('2026-02', false)} />)

    expect(screen.getByLabelText('Filtro mensual')).toHaveValue('2026-02')
    expect(
      screen.getByRole('combobox').parentElement,
    ).toHaveTextContent('Febrero 2026')
  })

  it('"Volver al mes actual" restablece el periodo desde un mes pasado', async () => {
    const mes = mesFalso('2026-02', false)
    render(<MonthFilter mes={mes} />)

    expect(boton()).toBeEnabled()
    await userEvent.click(boton())

    expect(mes.volverAlMesActual).toHaveBeenCalledTimes(1)
  })

  it('"Volver al mes actual" está deshabilitado en el mes en curso', () => {
    render(<MonthFilter mes={mesFalso('2026-05', true)} />)

    expect(boton()).toBeDisabled()
    expect(boton().className).toContain('opacity-60')
  })

  it('el desplegable nativo lleva color y fondo del tema', () => {
    render(<MonthFilter mes={mesFalso('2026-02', false)} />)

    const select = screen.getByRole('combobox')
    expect(select).toHaveClass('text-text-primary')
    expect(select).toHaveClass('bg-surface')
    for (const option of Array.from(select.querySelectorAll('option'))) {
      expect(option).toHaveClass('text-text-primary')
      expect(option).toHaveClass('bg-surface')
    }
  })
})
