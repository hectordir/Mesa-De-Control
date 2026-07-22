# Spec — Limpieza del scaffold Vite + página de ejemplo (Dashboard NOC)

**Slug:** `pagina-ejemplo-dashboard` · **Dominio:** `mesa-control-front`
**Depende de:** [`design-system-base.md`](./design-system-base.md) (implementado)

## Objetivo

Eliminar los restos del scaffold de Vite y sustituir el showcase de primitivas por una **página de
ejemplo realista** que demuestre el sistema de diseño en una composición de consola NOC. Sirve de
plantilla visual para el resto de páginas.

## Alcance

### 1. Limpieza
- Borrar `src/assets/` completo (`hero.png`, `react.svg`, `vite.svg`) y `public/vite.svg` si existe.
- Verificar que ningún import queda huérfano (`npm run build` es la prueba).
- **No** tocar `favicon.svg` si el `index.html` lo referencia; si se borra, actualizar el `<link rel="icon">`.

### 2. Página de ejemplo — `src/pages/DashboardPage.tsx`
Datos **estáticos y hardcodeados** en el propio archivo (sin fetch, sin Axios, sin React Query).
Layout de consola NOC en `bg-bg`, tema oscuro por defecto:

1. **Topbar** — título "Mesa de Control", subtítulo con fecha estática, y el toggle de tema
   (`data-theme` dark↔light en `<html>`) movido aquí desde `App.tsx`.
2. **Fila de KPIs** — 4 `StatCard` en grid responsive (1 col móvil / 2 tablet / 4 desktop):
   Tickets activos, En espera, Resueltos hoy, SLA en riesgo. Con `hint`.
3. **Tabla de gestiones recientes** dentro de un `Card` — columnas: ID, Cliente, Zona, Estado, Asignado.
   Estado renderizado con `Badge` (`success`/`warning`/`danger`/`info`/`neutral`). 6 filas.
   Semántica real: `<table>` con `<thead>`/`<tbody>`, header en `text-label uppercase text-text-muted`,
   filas separadas con `border-border-subtle`. Envuelta en contenedor `overflow-x-auto`.
4. **Panel lateral** en `Card` — "Distribución por categoría": 5 filas con una barra horizontal
   coloreada con `bg-cat-1` … `bg-cat-5` y su porcentaje. Sin librería de charts: `div` con `width`
   por estilo inline.
5. **Barra de acciones** — `Button` en sus 4 variantes (`primary`, `secondary`, `ghost`, `danger`)
   y un `Input` con `label="Buscar gestión"`.

`App.tsx` queda reducido a renderizar `<DashboardPage />`.

## Criterios de aceptación

1. `npm run lint`, `npm run build` y `npm test` pasan; los 43 tests existentes siguen verdes
   (adapta `App.test.tsx` si el toggle se muda a la página).
2. Test RTL nuevo `src/pages/DashboardPage.test.tsx`, escrito **antes** del componente:
   - Renderiza el título "Mesa de Control" y los 4 labels de KPI.
   - La tabla expone `role="table"` y 6 filas de datos (`getAllByRole('row')` = 7 con la cabecera).
   - El toggle alterna `data-theme` entre `dark` y `light` en `document.documentElement`.
   - Cada `Badge` de estado muestra su texto.
3. `src/pages/DashboardPage.tsx` **no** contiene colores hex ni clases de la paleta por defecto de
   Tailwind; extiende la guarda de `tokens-only.test.ts` para que también cubra `src/pages/`.
4. `src/assets/` ya no existe y `npm run build` sigue OK.
5. La página es responsive: sin scroll horizontal del `body` a 375px de ancho.

## Fuera de alcance

React Router (la página se monta directa desde `App.tsx`), data-fetching, gráficas con librería,
y el AppShell definitivo con sidebar — llegan en el ticket de routing.
