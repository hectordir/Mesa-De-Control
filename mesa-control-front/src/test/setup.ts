import '@testing-library/jest-dom/vitest'

/**
 * En Node 26 el `localStorage` experimental del runtime eclipsa al de jsdom y
 * queda `undefined` (hace falta `--localstorage-file`). Instalamos un `Storage`
 * en memoria para que el store de sesión funcione igual que en el navegador.
 */
function createMemoryStorage(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
    clear: () => map.clear(),
  } as Storage
}

for (const target of [globalThis, window] as const) {
  if (!target.localStorage) {
    Object.defineProperty(target, 'localStorage', {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    })
  }
}
if (globalThis.localStorage !== window.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: window.localStorage,
    configurable: true,
    writable: true,
  })
}
