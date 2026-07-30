import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ADMIN_HEX,
  todayIso,
  buildKpis,
  diasColor,
  diasLabel,
  estadoTone,
  formatFechaCorta,
  formatFechaLarga,
  heatCell,
  heatTotalBg,
  slaColor,
  zonaHex,
} from './admin.presentation'
import { deriveHeatmap } from './admin.presentation'
import type { SupervisionHeatmap, SupervisionKpis } from '../../../lib/api/types'

describe('admin.presentation · heatCell', () => {
  it('una celda en cero no pinta fondo', () => {
    expect(heatCell(0)).toEqual({ bg: 'transparent', color: 'var(--color-text-muted)' })
  })

  it('escala la intensidad con la cuenta y elige base por rango', () => {
    // n=3 → base success (n<=4), strength 0.14+3*0.06=0.32 → 32%
    expect(heatCell(3)).toEqual({
      bg: `color-mix(in srgb, ${ADMIN_HEX.success} 32%, transparent)`,
      color: 'var(--color-text-primary)',
    })
  })

  it('satura la intensidad al 55% para cuentas altas', () => {
    // n=9 → base danger, strength min(0.14+0.54,0.55)=0.55 → 55%
    expect(heatCell(9).bg).toBe(
      `color-mix(in srgb, ${ADMIN_HEX.danger} 55%, transparent)`,
    )
  })
})

describe('admin.presentation · SLA y días', () => {
  it('colorea el bucket 0 en verde y el 4+ en rojo', () => {
    expect(slaColor('0')).toBe(ADMIN_HEX.success)
    expect(slaColor('4+')).toBe(ADMIN_HEX.danger)
  })

  it('diasColor vira de verde a rojo con la antigüedad', () => {
    expect(diasColor(0)).toBe(ADMIN_HEX.success)
    expect(diasColor(2)).toBe(ADMIN_HEX.warning)
    expect(diasColor(4)).toBe(ADMIN_HEX.danger)
  })

  it('diasLabel singulariza el día y marca los críticos', () => {
    expect(diasLabel(1)).toBe('1 día')
    expect(diasLabel(2)).toBe('2 días')
    expect(diasLabel(4)).toBe('4 días ⚠')
  })
})

describe('admin.presentation · zonas y estados', () => {
  it('mapea estado de zona a su hex semántico', () => {
    expect(zonaHex('danger')).toBe(ADMIN_HEX.danger)
    expect(zonaHex('success')).toBe(ADMIN_HEX.success)
  })

  it('deduce el tono del estado de la bandeja por palabra clave', () => {
    expect(estadoTone('Escalado NOC')).toBe('danger')
    expect(estadoTone('En espera cliente')).toBe('info')
    expect(estadoTone('Soporte 2')).toBe('warning')
    expect(estadoTone('Otro')).toBe('neutral')
  })

  it('heatTotalBg crece con el total', () => {
    expect(heatTotalBg(0)).toBe(
      `color-mix(in srgb, ${ADMIN_HEX.brand} 8%, transparent)`,
    )
    expect(heatTotalBg(2)).toBe(
      `color-mix(in srgb, ${ADMIN_HEX.brand} 20%, transparent)`,
    )
  })
})

describe('admin.presentation · deriveHeatmap', () => {
  it('con >6 motivos deja 6 columnas top + "Otros" y conserva el total real de fila', () => {
    const heatmap: SupervisionHeatmap = {
      motivos: ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'],
      filas: [{ zona: 'Z', celdas: [1, 2, 3, 4, 5, 6, 7, 8], total: 36 }],
    }
    const out = deriveHeatmap(heatmap)
    // 6 top (por volumen desc) + Otros
    expect(out.motivos).toEqual(['m7', 'm6', 'm5', 'm4', 'm3', 'm2', 'Otros'])
    // Otros = m0 + m1 = 1 + 2 = 3
    expect(out.filas[0].celdas).toEqual([8, 7, 6, 5, 4, 3, 3])
    // total real de toda la fila (los 8 motivos)
    expect(out.filas[0].total).toBe(36)
  })

  it('con ≤6 motivos no agrega "Otros" y mantiene las columnas tal cual', () => {
    const heatmap: SupervisionHeatmap = {
      motivos: ['a', 'b', 'c'],
      filas: [{ zona: 'Z', celdas: [2, 0, 4], total: 6 }],
    }
    const out = deriveHeatmap(heatmap)
    expect(out.motivos).toEqual(['a', 'b', 'c'])
    expect(out.filas[0].celdas).toEqual([2, 0, 4])
    expect(out.filas[0].total).toBe(6)
  })
})

describe('admin.presentation · fechas y KPIs', () => {
  it('formatea la fecha larga en español', () => {
    expect(formatFechaLarga('2026-07-17')).toBe('17 de julio 2026')
  })

  it('formatea la fecha corta como dd/mm/yyyy', () => {
    expect(formatFechaCorta('2026-07-17')).toBe('17/07/2026')
  })

  it('construye 4 tarjetas KPI a partir del DTO', () => {
    const kpis: SupervisionKpis = {
      atendidosHoy: 142,
      atendidosDelta: 12,
      efectividad: 87,
      efectividadMeta: 85,
      escaladosNoc: 9,
      escaladosDelta: -3,
      slaCumplido: 94,
      slaMeta: 90,
    }
    const cards = buildKpis(kpis)
    expect(cards).toHaveLength(4)
    expect(cards[0]).toMatchObject({ label: 'Atendidos hoy', value: '142', delta: '+12' })
    expect(cards[2]).toMatchObject({ label: 'Escalados a NOC', value: '9', delta: '-3' })
    expect(cards[3]).toMatchObject({ label: 'SLA cumplido', unit: '%' })
  })
})

describe('todayIso · día de la operación en Venezuela', () => {
  const TZ_ORIGINAL = process.env.TZ

  beforeEach(() => {
    // Navegador en UTC: a las 02:00 Z todavía es el día anterior en Caracas.
    process.env.TZ = 'UTC'
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-18T02:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = TZ_ORIGINAL
  })

  it('no adelanta el día para un navegador al este de Caracas', () => {
    expect(new Date().getDate()).toBe(18) // guarda: el host sí está en UTC
    expect(todayIso()).toBe('2026-07-17')
  })
})
