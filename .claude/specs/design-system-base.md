# Spec — Sistema de diseño base (Fibex Control) en el front

**Slug:** `design-system-base` · **Dominio:** `mesa-control-front` · **Estado:** 🚦 pendiente de aprobación

## Objetivo

Instalar el sistema de diseño exportado en `D:\davi-workspace\Fibex Control Design System\export`
(tokens semánticos + escala tipográfica + radios + elevación, tema **oscuro por defecto**) como
base del front, y dejar un juego mínimo de **primitivas de UI** sobre el que se construirán todas
las páginas siguientes.

Fuente de verdad: `export/tokens.css` y `export/tailwind.config.js` (variante **Tailwind v3**, que
es la que usa este proyecto — `tailwindcss ^3.4.19` con PostCSS). `theme.v4.css` **no se usa**.

## Alcance

### 1. Tokens
- Copiar `tokens.css` → `mesa-control-front/src/styles/tokens.css` **sin modificar los valores**.
- `src/index.css`: `@import "./styles/tokens.css";` **antes** de las directivas `@tailwind`.
- En `@layer base`: `body { @apply bg-bg text-text-primary font-sans text-body; }`.

### 2. Configuración Tailwind
- Fusionar `export/tailwind.config.js` dentro de `mesa-control-front/tailwind.config.js`
  conservando **sintaxis ESM** (`export default`, el paquete es `"type": "module"`) y el `content`
  actual del proyecto (`["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`).
- Conservar `darkMode: ["selector", '[data-theme="dark"]']`.
- Copiar íntegros `colors`, `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `boxShadow`.

### 3. Tema
- `index.html`: `<html lang="es" data-theme="dark">`.
- Tipografía **Inter** vía `<link>` a Google Fonts en `<head>` (preconnect + css2, pesos 400/500/600/700),
  tal como indica el README del export.

### 4. Primitivas de UI (`src/components/ui/`)
Componentes tipados, sin lógica de negocio, que consumen **solo** utilidades de token
(prohibido hex crudo o clases `slate-*`/`blue-*` de la paleta por defecto de Tailwind):

| Componente | API |
|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'danger'`, `size: 'sm' \| 'md'`, resto de props de `<button>` |
| `Card` | `<Card>` + `<Card.Header>` / `<Card.Body>`; `bg-surface border border-border rounded-card shadow-elevation` |
| `Badge` | `tone: 'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'`, `rounded-chip` |
| `StatCard` | `label`, `value`, `hint?` — patrón del README (label en `text-label uppercase text-text-muted`, valor en `text-display`) |
| `Input` | `label?`, `error?`, `rounded-control`, estados focus/inválido con tokens |

Barril `src/components/ui/index.ts`.

### 5. Showcase
`App.tsx` reemplaza el demo de Vite por una galería de las primitivas (tema oscuro), con un toggle
que alterna `data-theme` entre `dark` y `light` en `<html>` — sirve de verificación visual de que
ambos temas funcionan.

## Criterios de aceptación

1. `npm run build` y `npm run lint` pasan sin errores ni warnings nuevos.
2. `npm test` pasa. Cada primitiva tiene su test RTL escrito **antes** del componente:
   - `Button` renderiza el texto, dispara `onClick`, y `variant="primary"` aplica `bg-brand`.
   - `Badge tone="success"` aplica la clase de token `success`.
   - `StatCard` muestra `label` y `value`.
   - `Input` asocia `label` con el control (`getByLabelText`) y expone `error` con `role="alert"`.
3. Un test verifica que `src/styles/tokens.css` define `--color-bg` tanto en el bloque por defecto
   (dark) como en `[data-theme="light"]` — protege contra pérdida de tokens al editar.
4. `grep` en `src/components/ui/` no encuentra colores hex ni clases de la paleta Tailwind por defecto.
5. En el navegador: `data-theme="dark"` da fondo `#0B0F1A`; `data-theme="light"` da `#F6F8FB`,
   sin recargar.

## Fuera de alcance

React Router, React Query, Zustand, Axios, Playwright, y cualquier página de negocio.
Esas llegan en tickets posteriores, ya apoyadas en estas primitivas.

## Dependencias nuevas (🚦 requieren aprobación)

`vitest`, `@vitest/coverage-v8` (opcional), `jsdom`, `@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/user-event` — todas `devDependencies`.
Sin ellas no hay TDD posible: hoy el front no tiene runner de tests.
Se añade el script `"test": "vitest run"` y `"test:watch": "vitest"`.
