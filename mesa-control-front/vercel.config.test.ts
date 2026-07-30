import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El router de la SPA usa history API real: sin este rewrite, recargar (F5) en
 * `/dashboard` pediría a Vercel un fichero inexistente y devolvería 404. Este
 * test es el guard contra un borrado accidental de `vercel.json`.
 */
type VercelConfig = {
  rewrites?: { source: string; destination: string }[]
}

function readVercelConfig(): VercelConfig {
  // El entorno de test es jsdom, donde `import.meta.url` no es un file://;
  // Vitest corre con el cwd en la raíz del proyecto, que es donde Vercel espera
  // el fichero (Root Directory = mesa-control-front).
  const path = resolve(process.cwd(), 'vercel.json')
  return JSON.parse(readFileSync(path, 'utf8')) as VercelConfig
}

describe('vercel.json', () => {
  it('es JSON válido', () => {
    expect(() => readVercelConfig()).not.toThrow()
  })

  it('declara un rewrite catch-all hacia /index.html', () => {
    const { rewrites } = readVercelConfig()
    expect(rewrites).toBeDefined()

    const catchAll = rewrites?.find(
      (rewrite) => rewrite.destination === '/index.html',
    )
    expect(catchAll).toBeDefined()
    expect(catchAll?.source).toBe('/(.*)')
  })

  it('el patrón del catch-all cubre las rutas internas de la SPA', () => {
    const { rewrites } = readVercelConfig()
    const catchAll = rewrites?.find(
      (rewrite) => rewrite.destination === '/index.html',
    )
    const pattern = new RegExp(`^${catchAll?.source ?? '(?!)'}$`)

    for (const route of [
      '/dashboard',
      '/registro',
      '/historial',
      '/fibex-play/gestion',
      '/admin',
      '/loquesea',
    ]) {
      expect(pattern.test(route)).toBe(true)
    }
  })
})
