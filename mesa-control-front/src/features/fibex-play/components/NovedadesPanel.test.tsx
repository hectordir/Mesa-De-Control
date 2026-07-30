import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { NovedadesPanel } from './NovedadesPanel'
import type { FallaCanal, FibexPlayKpis } from '../../../lib/api/types'

/**
 * `actualizadoEn` es un instante ISO. El panel debe rotularlo en la hora de la
 * operación (America/Caracas) aunque el navegador esté en Tokio (UTC+9), donde
 * ese mismo instante cae en el día siguiente.
 */
const TZ_ORIGINAL = process.env.TZ

beforeAll(() => {
  process.env.TZ = 'Asia/Tokyo'
})
afterAll(() => {
  process.env.TZ = TZ_ORIGINAL
})

const KPIS: FibexPlayKpis = {
  total: 165,
  operativos: 165,
  caidos: 0,
  saludGrilla: 100,
}

const FALLA: FallaCanal = {
  id: 'c1',
  nombre: 'ESPN',
  categoria: 'DEPORTES',
  tipoIncidencia: 'SIN_SENAL',
  severidad: 'CRITICA',
  hora: '05:42',
  detectadoEn: '2026-07-22T09:42:00.000Z',
}

describe('NovedadesPanel · instantes en hora venezolana', () => {
  it('el último sondeo se muestra en Caracas, no en la zona del navegador', () => {
    // Guarda: el navegador simulado está realmente en Tokio.
    expect(new Date('2026-07-22T20:00:00.000Z').getHours()).toBe(5)

    render(
      <NovedadesPanel
        kpis={KPIS}
        fallas={[]}
        actualizadoEn="2026-07-22T20:00:00.000Z"
      />,
    )

    expect(screen.getByText('16:00')).toBeInTheDocument()
  })

  it('el subtítulo no adelanta el día para un navegador al este de Caracas', () => {
    render(
      <NovedadesPanel
        kpis={KPIS}
        fallas={[]}
        actualizadoEn="2026-07-22T20:00:00.000Z"
      />,
    )

    expect(screen.getByText('miércoles 22 de julio')).toBeInTheDocument()
  })

  it('la hora de una falla se muestra tal cual la envía el backend', () => {
    render(
      <NovedadesPanel
        kpis={{ ...KPIS, operativos: 164, caidos: 1, saludGrilla: 99 }}
        fallas={[FALLA]}
        actualizadoEn="2026-07-22T20:00:00.000Z"
      />,
    )

    expect(screen.getByText('05:42')).toBeInTheDocument()
  })
})
