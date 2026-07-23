import { describe, expect, it } from 'vitest'
import {
  buildAtendidos,
  buildChart,
  buildDistribucion,
  buildHeatmap,
  buildOperadores,
  buildTendencia,
  efectividad,
  filterZones,
  fmt,
  metaStatus,
} from './analisis-mensual.derive'
import type {
  AnalisisMensualBar,
  AnalisisMensualDia,
  AnalisisMensualHeatmap,
  AnalisisMensualMotivo,
  AnalisisMensualOperador,
} from '../../lib/api/types'

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

const motivos = (...pares: Array<[string, number]>): AnalisisMensualMotivo[] =>
  pares.map(([motivo, total]) => ({ motivo, total }))

describe('buildDistribucion', () => {
  it('calcula porcentajes enteros que suman 100 y cicla colores por token', () => {
    const dist = buildDistribucion(motivos(['A', 50], ['B', 30], ['C', 20]))
    expect(dist.map((d) => d.pct)).toEqual([50, 30, 20])
    expect(dist.map((d) => d.color)).toEqual([
      'var(--color-cat-1)',
      'var(--color-cat-2)',
      'var(--color-cat-3)',
    ])
    expect(dist.reduce((a, d) => a + d.pct, 0)).toBe(100)
  })

  it('reparte el redondeo en el motivo mayor para cuadrar en 100', () => {
    const dist = buildDistribucion(motivos(['A', 7], ['B', 7], ['C', 7]))
    expect(dist.map((d) => d.pct)).toEqual([34, 33, 33])
    expect(dist.reduce((a, d) => a + d.pct, 0)).toBe(100)
  })

  it('agrupa el resto en "Otros" cuando hay más de 9 motivos', () => {
    const many = motivos(
      ['A', 10], ['B', 9], ['C', 8], ['D', 7], ['E', 6],
      ['F', 5], ['G', 4], ['H', 3], ['I', 2], ['J', 1],
    )
    const dist = buildDistribucion(many)
    expect(dist).toHaveLength(9)
    expect(dist[8]).toMatchObject({ label: 'Otros', total: 3 })
    expect(dist.reduce((a, d) => a + d.pct, 0)).toBe(100)
  })
})

describe('buildAtendidos', () => {
  it('escala barras a un techo bonito con 5 marcas y cicla colores', () => {
    const { barras, ticks, yMax } = buildAtendidos(
      motivos(['A', 140], ['B', 70], ['C', 35]),
    )
    expect(yMax).toBe(160)
    expect(ticks.map((t) => t.value)).toEqual([0, 40, 80, 120, 160])
    expect(barras[0]).toMatchObject({ label: 'A', total: 140, color: 'var(--color-cat-1)' })
    expect(barras[0].px).toBe(Math.round((140 / 160) * 230))
  })

  it('recorta a un máximo de 9 barras', () => {
    const many = Array.from({ length: 12 }, (_, i): [string, number] => [
      `M${i}`,
      12 - i,
    ])
    expect(buildAtendidos(motivos(...many)).barras).toHaveLength(9)
  })
})

const ops = (
  ...t: Array<[string, number, number, number]>
): AnalisisMensualOperador[] =>
  t.map(([nombre, solucionados, enviadosN2, total], i) => ({
    id: `o${i}`,
    nombre,
    solucionados,
    enviadosN2,
    total,
  }))

describe('buildOperadores', () => {
  it('ordena por total desc y calcula tasa y píxeles sobre un máximo común', () => {
    const { barras } = buildOperadores(
      ops(['Ana', 20, 20, 60], ['Beto', 40, 40, 100]),
    )
    expect(barras.map((b) => b.nombre)).toEqual(['Beto', 'Ana'])
    // máximo común = 40 → techo bonito 40, alto 210
    expect(barras[0].solPx).toBe(210)
    expect(barras[0].tasa).toBe(50)
  })

  it('el top asigna medalla por puesto y calcula eficiencia', () => {
    const { top } = buildOperadores(
      ops(
        ['Ana', 50, 10, 100], ['Beto', 30, 10, 80], ['Cira', 20, 20, 60],
        ['Dan', 10, 10, 40], ['Eva', 5, 5, 20], ['Fito', 1, 1, 10],
      ),
    )
    expect(top).toHaveLength(5)
    expect(top[0]).toMatchObject({ rank: 1, eficiencia: 50, medal: 'var(--color-warning)' })
    expect(top[1].medal).toBe('var(--color-text-secondary)')
    expect(top[2].medal).toBe('var(--color-bronze)')
    expect(top[3].medal).toBe('var(--color-text-muted)')
  })
})

describe('buildTendencia', () => {
  const dias: AnalisisMensualDia[] = [
    { fecha: '2026-05-20', atendidos: 40 },
    { fecha: '2026-05-21', atendidos: 80 },
  ]

  it('proyecta puntos, área, rejilla y etiquetas dd/MM', () => {
    const t = buildTendencia(dias)
    expect(t.yMax).toBe(80)
    expect(t.dots).toEqual([
      { cx: 0, cy: 125 },
      { cx: 940, cy: 0 },
    ])
    expect(t.linePts).toBe('0,125 940,0')
    expect(t.areaPts).toBe('0,250 0,125 940,0 940,250')
    expect(t.labels).toEqual(['20/05', '21/05'])
    expect(t.filas).toEqual(dias)
    expect(t.grid.map((g) => g.label)).toEqual(['0', '20', '40', '60', '80'])
  })

  it('sin días devuelve una tendencia vacía', () => {
    expect(buildTendencia([])).toEqual({
      linePts: '',
      areaPts: '',
      dots: [],
      grid: [],
      labels: [],
      filas: [],
      yMax: 0,
    })
  })
})
