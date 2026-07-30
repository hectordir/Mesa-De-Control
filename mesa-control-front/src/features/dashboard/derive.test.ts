import { describe, expect, it } from 'vitest'
import {
  anchoBarra,
  conicGradient,
  efectividad,
  efectividadTono,
  horaCorta,
  iniciales,
  segmentosDonut,
  totales,
} from './derive'
import type { DistribucionItem, OperadorResumen } from '../../lib/api/types'

const operadores: OperadorResumen[] = [
  { id: '1', nombre: 'Jhon Rivas', clientes: 78, mesa: 63, soporte2: 11, noc: 7 },
  { id: '2', nombre: 'María León', clientes: 66, mesa: 52, soporte2: 9, noc: 6 },
]

describe('efectividad', () => {
  it('redondea mesa/clientes a porcentaje entero', () => {
    expect(efectividad(63, 78)).toBe(81)
    expect(efectividad(40, 59)).toBe(68)
  })

  it('devuelve 0 cuando no hay clientes atendidos', () => {
    expect(efectividad(0, 0)).toBe(0)
    expect(efectividad(5, 0)).toBe(0)
  })

  it('usa el tono success desde 75 y warning por debajo', () => {
    expect(efectividadTono(75)).toBe('success')
    expect(efectividadTono(81)).toBe('success')
    expect(efectividadTono(74)).toBe('warning')
    expect(efectividadTono(0)).toBe('warning')
  })
})

describe('iniciales', () => {
  it('toma la primera letra de las dos primeras palabras', () => {
    expect(iniciales('Jhon Rivas')).toBe('JR')
    expect(iniciales('ana quintero pérez')).toBe('AQ')
  })

  it('tolera un solo nombre o vacío', () => {
    expect(iniciales('Operador')).toBe('O')
    expect(iniciales('   ')).toBe('')
  })
})

describe('totales', () => {
  it('suma cada columna de la tabla de operadores', () => {
    expect(totales(operadores)).toEqual({
      clientes: 144,
      mesa: 115,
      soporte2: 20,
      noc: 13,
    })
  })

  it('devuelve ceros sin operadores', () => {
    expect(totales([])).toEqual({ clientes: 0, mesa: 0, soporte2: 0, noc: 0 })
  })
})

const distribucion: DistribucionItem[] = [
  { resultado: 'SOLUCIONADO_MESA', total: 198 },
  { resultado: 'ENVIADO_SOPORTE2', total: 54 },
  { resultado: 'ESCALADO_NOC', total: 31 },
  { resultado: 'PENDIENTE_CLIENTE', total: 38 },
  { resultado: 'REAGENDADO', total: 21 },
]

describe('segmentosDonut', () => {
  it('calcula el porcentaje con un decimal y el corte acumulado', () => {
    const segmentos = segmentosDonut(distribucion)
    expect(segmentos.map((s) => s.pct)).toEqual([57.9, 15.8, 9.1, 11.1, 6.1])
    expect(segmentos.map((s) => s.hasta)).toEqual([57.9, 73.7, 82.8, 93.9, 100])
  })

  it('no divide por cero cuando todo está a cero', () => {
    expect(segmentosDonut([{ resultado: 'REAGENDADO', total: 0 }])[0].pct).toBe(0)
  })

  it('construye el conic-gradient con los colores de serie', () => {
    expect(conicGradient(segmentosDonut(distribucion))).toBe(
      'conic-gradient(var(--color-cat-2) 0 57.9%, var(--color-cat-3) 57.9% 73.7%, ' +
        'var(--color-cat-5) 73.7% 82.8%, var(--color-cat-1) 82.8% 93.9%, ' +
        'var(--color-cat-4) 93.9% 100%)',
    )
  })
})

describe('anchoBarra', () => {
  it('escala respecto al máximo', () => {
    expect(anchoBarra(84, 84)).toBe(100)
    expect(anchoBarra(61, 84)).toBe(73)
  })

  it('evita dividir por cero', () => {
    expect(anchoBarra(0, 0)).toBe(0)
  })
})

describe('horaCorta', () => {
  it('muestra la hora de la operación (America/Caracas) del instante', () => {
    expect(horaCorta('2026-07-17T10:42:00-04:00')).toBe('10:42')
    // El backend envía este campo como ISO UTC: 09:05 Z son 05:05 en Caracas.
    expect(horaCorta('2026-07-17T09:05:00.000Z')).toBe('05:05')
  })

  it('devuelve cadena vacía si el formato no es ISO', () => {
    expect(horaCorta('ayer')).toBe('')
  })
})
