import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationDatePicker } from './OperationDatePicker'
import {
  formatoCorto,
  hoyISO,
  type OperationDay,
} from '../hooks/useOperationDay'
import { MESES } from '../../../lib/fechas'
import { useDashboardDateStore } from '../../../stores/dashboardDate.store'

function diaFalso(fecha: string): OperationDay {
  return {
    fecha,
    largo: 'viernes 17 de julio de 2026',
    corto: formatoCorto(fecha),
    esHoy: fecha === hoyISO(),
    setFecha: vi.fn(),
    volverAHoy: vi.fn(),
  }
}

const chip = () => screen.getByTestId('chip-fecha')

/** Primer día del mes anterior: siempre pasado, siempre elegible. */
function primerDiaMesAnterior(): Date {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
}

function iso(fecha: Date): string {
  const mes = `${fecha.getMonth() + 1}`.padStart(2, '0')
  const dia = `${fecha.getDate()}`.padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

/**
 * El calendario rotula cada día en español ("lunes, 1 de junio de 2026"):
 * reconstruimos ese nombre accesible para localizar el día a clicar.
 */
function nombreDia(fecha: Date): RegExp {
  const n = fecha.getDate()
  return new RegExp(`\\b${n} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`)
}

async function abrirMesAnterior(user: ReturnType<typeof userEvent.setup>) {
  await user.click(chip())
  await user.click(screen.getByRole('button', { name: 'Ir al mes anterior' }))
}

describe('OperationDatePicker', () => {
  // El componente recibe su estado por props, pero la fecha del dashboard es un
  // store global: se restablece para no depender del orden de ejecución.
  beforeEach(() => {
    useDashboardDateStore.setState({ fecha: hoyISO() })
  })

  it('el chip es un botón accesible con la fecha de operación', () => {
    render(<OperationDatePicker dia={diaFalso('2026-07-17')} />)

    const boton = screen.getByRole('button', {
      name: /fecha de operación.*17 jul 2026/i,
    })
    expect(boton).toBe(chip())
    expect(boton).toHaveAttribute('aria-haspopup', 'dialog')
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(chip()).toHaveTextContent('17 jul 2026')
  })

  it('ya no monta el input de fecha nativo', () => {
    const { container } = render(
      <OperationDatePicker dia={diaFalso('2026-07-17')} />,
    )

    expect(container.querySelector('input')).toBeNull()
  })

  it('un clic en cualquier parte del chip abre el calendario del tema', async () => {
    const user = userEvent.setup()
    render(<OperationDatePicker dia={diaFalso('2026-07-17')} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(chip())

    expect(
      screen.getByRole('dialog', { name: /fecha de operación/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('el popover se ancla a la derecha para no salirse de pantalla', async () => {
    const user = userEvent.setup()
    render(<OperationDatePicker dia={diaFalso('2026-07-17')} />)

    await user.click(chip())

    expect(screen.getByRole('dialog')).toHaveClass('right-0')
  })

  it('elegir un día llama a setFecha con el ISO y cierra el calendario', async () => {
    const user = userEvent.setup()
    const dia = diaFalso(hoyISO())
    render(<OperationDatePicker dia={dia} />)

    const elegido = primerDiaMesAnterior()
    await abrirMesAnterior(user)
    await user.click(screen.getByRole('button', { name: nombreDia(elegido) }))

    expect(dia.setFecha).toHaveBeenCalledWith(iso(elegido))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('no ofrece fechas futuras', async () => {
    const user = userEvent.setup()
    render(<OperationDatePicker dia={diaFalso(hoyISO())} />)

    await user.click(chip())
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    // Si hoy es fin de mes, mañana cae en el mes siguiente: navegamos.
    if (manana.getMonth() !== new Date().getMonth()) {
      await user.click(screen.getByRole('button', { name: 'Ir al mes siguiente' }))
    }

    expect(
      screen.getByRole('button', { name: nombreDia(manana) }),
    ).toBeDisabled()
  })

  it('"Volver a hoy" restablece la fecha cuando hay un día pasado', async () => {
    const dia = diaFalso('2026-07-17')
    render(<OperationDatePicker dia={dia} />)

    const boton = screen.getByRole('button', { name: /volver a hoy/i })
    expect(boton).toBeEnabled()
    await userEvent.click(boton)

    expect(dia.volverAHoy).toHaveBeenCalledTimes(1)
  })

  it('"Volver a hoy" está deshabilitado cuando ya se está en hoy', () => {
    const dia = diaFalso(hoyISO())
    render(<OperationDatePicker dia={dia} />)

    expect(screen.getByRole('button', { name: /volver a hoy/i })).toBeDisabled()
  })
})
