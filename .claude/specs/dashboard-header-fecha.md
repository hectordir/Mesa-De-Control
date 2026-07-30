# Spec — Header del Dashboard: toggle fijo + selector de fecha real

**Alcance:** sólo `mesa-control-front`. El backend **no se toca**.

## Contexto

- `components/DashboardViewToggle.tsx` — los toggles "Monitor Diario" / "Análisis Mensual" son
  `NavLink` de React Router.
- `components/PageHeader.tsx:8-20` — flex `justify-between` con título + toggle + `OperationDatePicker`.
- `AnalisisMensualPage.tsx:41-54` — **duplica** ese header inline con `MonthFilter` (sin botón
  "Volver a hoy") en vez de reutilizar `PageHeader`.
- `components/OperationDatePicker.tsx:15-26` — chip **decorativo**: no hay input real.
- `hooks/useOperationDay.ts:63,78` — `setFecha` existe pero **nadie lo llama**.
- `hooks/useMonitorDiario.ts:5-14` — key `['monitor-diario', fecha]`; `lib/api/dashboard.ts:13-21`
  ya manda `params: { fecha }`.
- `dashboard.controller.ts:23-42` + `dto/monitor-diario-query.dto.ts:4-18` — el back ya acepta
  `fecha?: string` (`YYYY-MM-DD`, ISO8601 estricto, 400 si el formato falla, default = hoy).

## Objetivo 1 — El contenedor del toggle no se mueve al cambiar de ruta

Hoy salta porque: (a) el vecino derecho cambia de ancho (`OperationDatePicker` con botón vs
`MonthFilter` sin él), (b) el subtítulo izquierdo cambia de longitud, y (c) el segmento activo
añade un punto de 6px + gap que desplaza los labels.

**Criterios de aceptación**

1. El toggle ocupa **la misma posición y el mismo ancho** en `/dashboard` y en
   `/dashboard/analisis-mensual`. Se logra fijando el ancho de cada segmento y reservando el
   hueco del punto activo (punto siempre presente, invisible cuando el segmento no está activo).
2. El bloque derecho (date picker / filtro mensual) tiene un **`min-w` común**, de modo que su
   cambio de contenido no reposiciona al toggle.
3. `AnalisisMensualPage` **reutiliza `PageHeader`** en vez de duplicarlo; `PageHeader` recibe el
   control derecho por prop (`children` o `control`). Un solo layout, una sola fuente de verdad.
4. Test: renderizar ambas rutas y comprobar que el contenedor del toggle conserva las mismas
   clases de layout / que ambos segmentos tienen ancho reservado. El punto activo existe en el DOM
   en los dos segmentos.

## Objetivo 2 — Selector de fecha real que pega al back

**Criterios de aceptación**

1. `OperationDatePicker` monta un `<input type="date">` real, siguiendo el patrón ya usado por
   `MonthFilter.tsx:25-36` (control nativo superpuesto con `opacity-0` sobre el chip, para no
   romper el diseño actual).
2. `value = dia.fecha` (`YYYY-MM-DD`); `onChange` llama a `dia.setFecha(valor)`. Se ignora un
   valor vacío (el usuario borra el input) — la fecha previa se mantiene.
3. `max = hoyISO()`: no se pueden pedir fechas futuras (no existen datos).
4. Cambiar la fecha dispara la query `['monitor-diario', fecha]` con el nuevo día y la vista
   muestra los datos de esa fecha. El chip visible pasa a mostrar la fecha elegida en formato
   corto (`17 jul 2026`) y el subtítulo el formato largo.
5. El input es accesible: `aria-label="Fecha de operación"`, alcanzable por teclado.
6. Tests: (a) cambiar el input llama a `setFecha` con el ISO correcto; (b) test de integración
   que verifica que `fetchMonitorDiario` se invoca con la fecha elegida.

## Objetivo 3 — "Volver a hoy" funciona

**Criterios de aceptación**

1. Con una fecha distinta de hoy seleccionada, pulsar "Volver a hoy" devuelve `dia.fecha` a
   `hoyISO()` y la vista recarga los datos de hoy.
2. Cuando ya se está en hoy, el botón está **`disabled`** (además del `opacity-60` actual), para
   que no sea un control muerto que parece pulsable.
3. Tests: pulsar con fecha pasada → vuelve a hoy; en hoy → `disabled`.

## Restricciones

- **Mantener la paleta y el estilo actuales**: sólo tokens Tailwind ya presentes en el proyecto.
  Nada de hex nuevos, ni cambios de tipografía, alturas o radios.
- Sin dependencias nuevas (nada de librerías de calendario). Input nativo.
- La fecha sigue viviendo en el `useState` de `useOperationDay` (local a la página). No se
  introduce store global en este ticket.
- TDD: test que falla primero, en cada objetivo.
