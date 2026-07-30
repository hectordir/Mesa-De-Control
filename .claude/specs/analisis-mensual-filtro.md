# Spec — Análisis Mensual: "Volver al mes actual" + select legible en modo oscuro

**Alcance:** sólo `mesa-control-front`. El backend **no se toca**. Sin dependencias nuevas.

## Contexto

- `features/dashboard/components/MonthFilter.tsx:25-36` — chip con un `<select>` nativo superpuesto
  (`absolute inset-0 opacity-0`). El `<select>` hereda `color: text-text-primary` (blanco en tema
  oscuro) del `<div>` padre `:17`. El desplegable nativo lo pinta el navegador con fondo claro,
  así que queda **texto blanco sobre fondo blanco**: ilegible. El `opacity-0` no afecta al popup.
- `features/dashboard/hooks/useMonthFilter.ts:28-34` — `MonthFilterState` expone `periodo`,
  `etiqueta`, `opciones`, `setPeriodo`. **No** hay equivalente de `esHoy` / `volverAHoy`.
- `features/dashboard/hooks/useMonthFilter.ts:18-21` — `mesActualISO()` ya existe.
- Referencia de consistencia: `components/OperationDatePicker.tsx` — botón "Volver a hoy",
  `disabled` cuando ya se está en hoy, y `useOperationDay.ts:62,70` con `esHoy` / `volverAHoy`.

## Objetivo 1 — Botón "Volver al mes actual"

**Criterios de aceptación**

1. `useMonthFilter` expone `esMesActual: boolean` (`periodo === mesActualISO()`) y
   `volverAlMesActual: () => void`, en paralelo exacto a `useOperationDay`.
2. `MonthFilter` renderiza un botón "Volver al mes actual" a la derecha del chip, con **el mismo
   aspecto, tokens y posición relativa** que el "Volver a hoy" del Monitor Diario. Es un tema de
   consistencia visual entre las dos vistas: copia el patrón, no inventes uno nuevo.
3. Con un mes pasado seleccionado, pulsarlo devuelve el periodo al mes en curso y la vista
   recarga los datos de ese periodo.
4. Cuando ya se está en el mes actual, el botón está `disabled` (y mantiene el `opacity-60` del
   equivalente diario).
5. Tests: vuelve al mes actual desde un mes pasado; `disabled` en el mes actual.

**Nota de layout:** el bloque derecho del header tiene un ancho reservado común
(`PageHeader.tsx`, `min-w-[…]`) precisamente para que el toggle no se mueva entre rutas. Al añadir
este botón, el filtro mensual crece; **verificar que el toggle "Monitor Diario / Análisis Mensual"
sigue en la misma posición en ambas rutas** y ajustar el ancho reservado si hiciera falta.

## Objetivo 2 — El desplegable de meses se lee en modo oscuro

**Criterios de aceptación**

1. El desplegable nativo de meses es legible en tema oscuro **y** en tema claro.
2. Solución preferente: declarar `color-scheme` según el tema activo (`dark` / `light`) en la raíz
   del documento, junto al resto de tokens de tema. Es lo que hace que el navegador pinte los
   controles nativos —desplegables, scrollbars, calendario de `<input type=date>`— con la paleta
   correcta, en lugar de parchear un único `<select>`.
3. Refuerzo local: el `<select>` y sus `<option>` reciben color de texto y fondo explícitos con
   tokens del tema, para los navegadores que ignoran `color-scheme` en el popup.
4. Verificar que el cambio de `color-scheme` **no degrada** otros controles nativos ya existentes
   (el `<input type="date">` ya no existe en el dashboard, pero revisar formularios de Registro,
   Historial y cualquier `<select>` o scrollbar del proyecto).
5. Test: el `<select>` de meses lleva las clases de color/fondo del tema; y si `color-scheme` se
   declara vía CSS, dejar constancia con un test del token o, si no es testeable en jsdom,
   indicarlo explícitamente en el resumen.

## Restricciones

- **Mantener la paleta y el estilo actuales**: sólo tokens ya presentes. Cero colores hex nuevos.
- Sin dependencias nuevas. No tocar `mesa-control-back` ni la capa de API del front.
- TDD: test que falla primero en cada objetivo.
