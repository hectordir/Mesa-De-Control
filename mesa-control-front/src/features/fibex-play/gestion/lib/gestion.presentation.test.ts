import { describe, expect, it } from 'vitest'
import {
  ESTADO_LABEL,
  ESTADO_OPCIONES,
  iniciales,
  origenColorToken,
} from './gestion.presentation'

describe('gestion.presentation', () => {
  it('mapea cada estado a su etiqueta legible', () => {
    expect(ESTADO_LABEL.SOLUCIONADO).toBe('Solucionado')
    expect(ESTADO_LABEL.EN_PROCESO).toBe('En proceso')
    expect(ESTADO_LABEL.ESCALADO).toBe('Escalado')
  })

  it('expone las opciones del control segmentado de estado', () => {
    expect(ESTADO_OPCIONES.map((o) => o.value)).toEqual([
      'SOLUCIONADO',
      'EN_PROCESO',
      'ESCALADO',
    ])
  })

  it('deriva iniciales del nombre del operador', () => {
    expect(iniciales('Jhon Rivas')).toBe('JR')
    expect(iniciales('María')).toBe('MA')
    expect(iniciales('')).toBe('?')
  })

  it('asigna un token de color categórico por índice, cíclico', () => {
    expect(origenColorToken(0)).toBe('var(--color-cat-1)')
    expect(origenColorToken(5)).toBe('var(--color-cat-6)')
    expect(origenColorToken(6)).toBe('var(--color-cat-1)')
  })
})
