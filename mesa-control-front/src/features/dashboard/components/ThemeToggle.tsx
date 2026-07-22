import { useState } from 'react'
import { MoonIcon, SunIcon } from './icons'

type Theme = 'dark' | 'light'

function temaActual(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark'
}

/** Alterna `data-theme` en `<html>`; el resto del árbol reacciona por tokens. */
export function ThemeToggle() {
  const [tema, setTema] = useState<Theme>(temaActual)

  function alternar() {
    const siguiente: Theme = tema === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', siguiente)
    setTema(siguiente)
  }

  const esClaro = tema === 'light'

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={esClaro}
      aria-label={esClaro ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {esClaro ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </button>
  )
}
