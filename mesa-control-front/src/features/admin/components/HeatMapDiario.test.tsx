import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { HeatMapDiario } from './HeatMapDiario'
import type { SupervisionHeatmap } from '../../../lib/api/types'

const heatmap = (motivos: number): SupervisionHeatmap => ({
  motivos: Array.from({ length: motivos }, (_, i) => `Motivo ${i}`),
  filas: [
    {
      zona: 'Caraballeda',
      celdas: Array.from({ length: motivos }, (_, i) => i + 1),
      total: Array.from({ length: motivos }, (_, i) => i + 1).reduce((a, b) => a + b, 0),
    },
  ],
})

beforeEach(() => {
  document.documentElement.setAttribute('data-theme', 'dark')
})

describe('HeatMapDiario', () => {
  it('la tabla no fija min-width y cabe sin scroll horizontal forzado', () => {
    render(<HeatMapDiario heatmap={heatmap(3)} fecha="2026-07-23" />)
    const tabla = screen.getByRole('table')
    expect(tabla).toHaveClass('table-fixed')
    expect(tabla.className).not.toMatch(/min-w-/)
    expect(screen.getByTestId('heatmap-table-wrap')).not.toHaveClass('overflow-x-auto')
  })

  it('con más de 6 motivos colapsa el resto en una columna "Otros"', () => {
    render(<HeatMapDiario heatmap={heatmap(8)} fecha="2026-07-23" />)
    // 6 columnas top + Otros + Total (+ Zona)
    expect(screen.getByRole('columnheader', { name: 'Otros' })).toBeInTheDocument()
    // total real de la fila = 1+2+…+8 = 36
    expect(screen.getByText('36')).toBeInTheDocument()
  })

  it('con 6 motivos o menos no añade "Otros"', () => {
    render(<HeatMapDiario heatmap={heatmap(6)} fecha="2026-07-23" />)
    expect(screen.queryByRole('columnheader', { name: 'Otros' })).not.toBeInTheDocument()
  })
})
