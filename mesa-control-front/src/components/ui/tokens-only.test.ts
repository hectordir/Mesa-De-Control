import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dirs = [
  'src/components/ui',
  'src/pages',
  'src/features',
  'src/routes',
] as const

/** Recorre `dir` en profundidad y devuelve sus fuentes (sin tests). */
function sourcesIn(dir: string): Array<readonly [string, string]> {
  const abs = resolve(process.cwd(), dir)
  return readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return sourcesIn(`${dir}/${entry.name}`)
    if (!/\.tsx?$/.test(entry.name) || entry.name.includes('.test.')) return []
    return [
      [`${dir}/${entry.name}`, readFileSync(join(abs, entry.name), 'utf8')] as const,
    ]
  })
}

const uiSources = sourcesIn(dirs[0])
const sources: Array<readonly [string, string]> = dirs.flatMap(sourcesIn)

const HEX = /#[0-9a-fA-F]{3,8}\b/
/** Paleta por defecto de Tailwind usada como clase de utilidad. */
const DEFAULT_PALETTE =
  /\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|divide|accent|caret|decoration|placeholder)-(?:slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/

describe('primitivas de UI y páginas: solo utilidades de token', () => {
  it('los detectores reconocen violaciones de ejemplo', () => {
    expect(HEX.test('color: #0B0F1A')).toBe(true)
    expect(DEFAULT_PALETTE.test('class="bg-slate-800 text-blue-500"')).toBe(true)
  })

  it('encuentra al menos las cinco primitivas', () => {
    expect(uiSources.length).toBeGreaterThanOrEqual(5)
  })

  it('también inspecciona las páginas', () => {
    expect(sources.some(([f]) => f.startsWith('src/pages/'))).toBe(true)
  })

  it('también inspecciona features y rutas', () => {
    expect(
      sources.some(([f]) => f.startsWith('src/features/auth/components/')),
    ).toBe(true)
    expect(sources.some(([f]) => f.startsWith('src/routes/'))).toBe(true)
  })

  it('cubre el dashboard completo (página, hooks y componentes)', () => {
    const dashboard = sources.filter(([f]) =>
      f.startsWith('src/features/dashboard/'),
    )
    expect(dashboard.length).toBeGreaterThanOrEqual(20)
    for (const parcial of [
      'src/features/dashboard/MonitorDiarioPage.tsx',
      'src/features/dashboard/hooks/useMonitorDiario.ts',
      'src/features/dashboard/components/DonutChart.tsx',
    ]) {
      expect(dashboard.some(([f]) => f === parcial), parcial).toBe(true)
    }
  })

  for (const [file, code] of sources) {
    it(`${file} no usa var() de color fuera de los tokens`, () => {
      const vars = code.match(/var\(--[a-z0-9-]+\)/g) ?? []
      for (const usada of vars) {
        expect(usada).toMatch(/^var\(--(color|shadow)-/)
      }
    })
  }

  for (const [file, code] of sources) {
    it(`${file} no usa colores hex`, () => {
      expect(HEX.test(code)).toBe(false)
    })

    it(`${file} no usa la paleta por defecto de Tailwind`, () => {
      expect(DEFAULT_PALETTE.test(code)).toBe(false)
    })
  }
})
