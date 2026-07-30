import { render, screen } from '@testing-library/react'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { RadarItem } from './RadarItem'
import type { ActividadItem } from '../../../lib/api/types'

/**
 * El radar recibe `hora` como **ISO UTC crudo** del backend. La hora mostrada
 * debe ser la de la operación (America/Caracas) aunque el navegador esté en
 * cualquier otra zona: aquí forzamos Tokio (UTC+9) para demostrarlo.
 */
const TZ_ORIGINAL = process.env.TZ

beforeAll(() => {
  process.env.TZ = 'Asia/Tokyo'
})
afterAll(() => {
  process.env.TZ = TZ_ORIGINAL
})

const item = (hora: string): ActividadItem => ({
  id: 'a-1',
  operador: 'Jhon Pérez',
  resultado: 'SOLUCIONADO_MESA',
  ubicacion: 'Barquisimeto',
  hora,
})

describe('RadarItem · hora de la actividad', () => {
  it('muestra la hora venezolana de un instante en UTC, no la del navegador', () => {
    // Guarda: el navegador simulado está realmente en Tokio.
    expect(new Date('2026-07-17T12:00:00.000Z').getHours()).toBe(21)

    render(<ul>{<RadarItem actividad={item('2026-07-17T12:00:00.000Z')} />}</ul>)

    expect(screen.getByText('08:00')).toBeInTheDocument()
  })

  it('respeta el offset explícito del ISO', () => {
    render(<ul>{<RadarItem actividad={item('2026-07-17T10:42:00-04:00')} />}</ul>)

    expect(screen.getByText('10:42')).toBeInTheDocument()
  })
})
