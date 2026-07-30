import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync(
  resolve(process.cwd(), 'src/styles/tokens.css'),
  'utf8',
)

/** Devuelve el cuerpo del primer bloque cuyo selector contiene `selector`. */
function blockContaining(selector: string): string {
  const index = tokens.indexOf(selector)
  expect(index, `selector ${selector} no encontrado`).toBeGreaterThan(-1)
  const start = tokens.indexOf('{', index)
  const end = tokens.indexOf('}', start)
  return tokens.slice(start, end)
}

describe('tokens.css', () => {
  it('define el tema oscuro por defecto en :root con --color-bg', () => {
    expect(blockContaining(':root')).toContain('--color-bg: #0B0F1A;')
  })

  it('define --color-bg en el tema claro [data-theme="light"]', () => {
    expect(blockContaining('[data-theme="light"]')).toContain(
      '--color-bg: #F6F8FB;',
    )
  })

  it('declara color-scheme por tema para los controles nativos', () => {
    expect(blockContaining(':root')).toContain('color-scheme: dark;')
    expect(blockContaining('[data-theme="light"]')).toContain(
      'color-scheme: light;',
    )
  })

  it('mantiene los tokens semánticos clave en ambos temas', () => {
    const dark = blockContaining(':root')
    const light = blockContaining('[data-theme="light"]')
    for (const token of [
      '--color-surface',
      '--color-border',
      '--color-text-primary',
      '--color-brand',
      '--color-success',
      '--color-warning',
      '--color-danger',
      '--color-info',
      '--shadow-elevation',
    ]) {
      expect(dark, `dark: ${token}`).toContain(`${token}:`)
      expect(light, `light: ${token}`).toContain(`${token}:`)
    }
  })
})
