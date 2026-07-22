import { describe, expect, it } from 'vitest'
import {
  buildChart,
  buildHeatmap,
  efectividad,
  filterZones,
  fmt,
  metaStatus,
} from './analisis-mensual.derive'
import type { AnalisisMensualBar, AnalisisMensualHeatmap } from '../../lib/api/types'

/** Serie del diseño: Febrero–Mayo. */
const SERIE: AnalisisMensualBar[] = [
  { mes: 'Febrero', periodo: '2026-02', resueltas: 545, resto: 735 },
  { mes: 'Marzo', periodo: '2026-03', resueltas: 470, resto: 1150 },
  { mes: 'Abril', periodo: '2026-04', resueltas: 720, resto: 980 },
  { mes: 'Mayo', periodo: '2026-05', resueltas: 209, resto: 276 },
]

const HEATMAP: AnalisisMensualHeatmap = {
  motivos: ['Falla LOS', 'Internet Lento', 'Sin Internet'],
  zonas: [
    { zona: 'Canaima', valores: [0, 4, 8] },
    { zona: 'Caraballeda', valores: [2, 1, 0] },
    { zona: 'Macuto', valores: [1, 1, 1] },
  ],
}

describe('efectividad', () => {
  it('redondea el porcentaje de resueltos sobre el volumen', () => {
    expect(efectividad(485, 209)).toBe(43)
    expect(efectividad(200, 130)).toBe(65)
  })

  it('devuelve 0 cuando no hay volumen', () => {
    expect(efectividad(0, 0)).toBe(0)
    expect(efectividad(0, 12)).toBe(0)
  })
})

describe('metaStatus', () => {
  it('avisa en ámbar cuántos puntos faltan para la meta', () => {
    expect(metaStatus(43, 65)).toEqual({
      label: '22 pts bajo meta',
      tone: 'warning',
    })
  })

  it('celebra en verde cuando se supera la meta', () => {
    expect(metaStatus(71, 65)).toEqual({
      label: '6 pts sobre meta',
      tone: 'success',
    })
    expect(metaStatus(65, 65)).toEqual({
      label: '0 pts sobre meta',
      tone: 'success',
    })
  })

  it('sin datos del mes muestra un guion apagado', () => {
    expect(metaStatus(0, 65, false)).toEqual({ label: '—', tone: 'muted' })
  })
})

describe('buildChart', () => {
  const chart = buildChart(SERIE)

  it('elige un techo "bonito" por encima del total mayor', () => {
    expect(chart.yMax).toBe(1800)
  })

  it('reparte cinco marcas equiespaciadas con su posición en px', () => {
    expect(chart.ticks.map((t) => t.label)).toEqual([
      '0',
      '450',
      '900',
      '1.350',
      '1.800',
    ])
    expect(chart.ticks.map((t) => t.bottom)).toEqual([0, 75, 150, 225, 300])
  })

  it('calcula alturas, efectividad y textos de cada barra', () => {
    expect(chart.bars).toHaveLength(4)
    expect(chart.bars[0]).toEqual({
      name: 'Febrero',
      periodo: '2026-02',
      resueltasPx: 91,
      restoPx: 123,
      resueltasFmt: '545',
      restoFmt: '735',
      totalFmt: '1.280',
      effPct: 43,
      tipBottom: 224,
    })
  })

  it('serie vacía: sin techo, sin marcas y sin barras', () => {
    expect(buildChart([])).toEqual({ yMax: 0, ticks: [], bars: [] })
  })

  it('un mes sin gestiones no rompe la efectividad', () => {
    const chart0 = buildChart([
      { mes: 'Enero', periodo: '2026-01', resueltas: 0, resto: 0 },
    ])
    expect(chart0.bars[0].effPct).toBe(0)
    expect(chart0.bars[0].resueltasPx).toBe(0)
  })
})

describe('buildHeatmap', () => {
  const mapa = buildHeatmap(HEATMAP)

  it('acumula totales por fila y del mes completo', () => {
    expect(mapa.rows.map((r) => r.total)).toEqual([12, 3, 3])
    expect(mapa.grandTotal).toBe(18)
    expect(mapa.maxCell).toBe(8)
    expect(mapa.maxTotal).toBe(12)
  })

  it('normaliza cada celda contra el máximo de la matriz', () => {
    const canaima = mapa.rows[0]
    expect(canaima.zona).toBe('Canaima')
    expect(canaima.cells.map((c) => c.v)).toEqual([0, 4, 8])
    expect(canaima.cells.map((c) => c.t)).toEqual([0, 0.5, 1])
    expect(canaima.totalT).toBe(1)
  })

  it('matriz vacía: totales en cero y máximos neutros', () => {
    expect(buildHeatmap({ motivos: [], zonas: [] })).toEqual({
      motivos: [],
      rows: [],
      maxCell: 1,
      maxTotal: 1,
      grandTotal: 0,
    })
  })
})

describe('filterZones', () => {
  const { rows } = buildHeatmap(HEATMAP)

  it('filtra por nombre de zona sin distinguir mayúsculas', () => {
    expect(filterZones(rows, 'car').map((r) => r.zona)).toEqual(['Caraballeda'])
    expect(filterZones(rows, '  MACU ').map((r) => r.zona)).toEqual(['Macuto'])
  })

  it('sin consulta devuelve todas las zonas', () => {
    expect(filterZones(rows, '')).toHaveLength(3)
  })
})

describe('fmt', () => {
  it('formatea en es-VE', () => {
    expect(fmt(1350)).toBe('1.350')
    expect(fmt(0)).toBe('0')
  })
})
