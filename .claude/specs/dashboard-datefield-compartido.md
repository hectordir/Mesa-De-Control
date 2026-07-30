# Spec — Reutilizar el calendario de Historial en el Dashboard

**Alcance:** sólo `mesa-control-front`. El backend **no se toca**. Sin dependencias nuevas
(`react-day-picker` ya está instalada y en uso).

## Contexto

- `features/registro/components/campos/DateField.tsx:34-110` — disparador `<button>` con
  `aria-haspopup="dialog"` + popover `DayPicker` (`mode="single"`), cierre por clic fuera y
  Escape, estilizado con tokens del tema (`campos/dateField.css`). Historial lo reutiliza para
  DESDE/HASTA. **Todo el disparador abre el calendario**, que es justo lo que se pidió.
- Está envuelto en `FieldShell` + `controlClass`: aspecto de campo de formulario ancho, con
  label encima. Ese envoltorio **no** encaja en la barra compacta del dashboard.
- `features/dashboard/components/OperationDatePicker.tsx` — chip compacto con
  `<input type="date">` nativo superpuesto (`opacity-0`) + `showPicker()` + `pointer-events-none`,
  con label "FECHA DE OPERACIÓN" y botón "Volver a hoy".

## Objetivo

El dashboard usa el **mismo calendario** que Historial, adaptado a su chip compacto, y desaparece
el input nativo con su hack de apertura.

## Diseño

Separar el calendario (lógica + popover) de su envoltorio de formulario:

1. Extraer a un componente compartido — p. ej. `src/components/ui/DatePickerPopover.tsx` — el
   estado `open`, el cierre por clic fuera / Escape, el `DayPicker` y los helpers `parseISO` /
   `toISO`. Recibe el **disparador** como render-prop o `children`, de modo que cada consumidor
   aporte su propio aspecto. `formatLegible` (`DD/MM/YYYY`) se queda en el consumidor: el
   dashboard usa `formatoCorto` (`27 jul 2026`).
2. `DateField` (registro/historial) pasa a consumirlo. **Su comportamiento y su aspecto no
   cambian en absoluto** — los tests actuales de `DateField`, Registro e Historial deben seguir
   pasando sin tocarlos.
3. `OperationDatePicker` pasa a consumirlo con el chip actual como disparador.

## Criterios de aceptación

1. En `/dashboard`, un clic en cualquier parte del chip de fecha abre el calendario del tema
   (el mismo de Historial), no el desplegable nativo del navegador.
2. Elegir un día cierra el popover y refetchea el Monitor Diario con esa fecha
   (`['monitor-diario', fecha]` → `GET /dashboard/monitor-diario?fecha=…`).
3. **No se pueden elegir días futuros**: `DayPicker` recibe `disabled={{ after: hoy }}`,
   equivalente al `max={hoyISO()}` que tenía el input nativo.
4. "Volver a hoy" sigue funcionando y sigue `disabled` cuando ya se está en hoy.
5. Cierre por clic fuera y por Escape, igual que en Historial.
6. Accesible: el disparador es un `<button>` real con `aria-haspopup="dialog"` y `aria-expanded`,
   con nombre accesible que incluya "Fecha de operación" y la fecha actual. Alcanzable por teclado.
7. Se elimina de `OperationDatePicker` el `<input type="date">`, `showPicker()`,
   `pointer-events-none` y el `onKeyDown` asociado, junto con sus tests, que dejan de aplicar.
   No queda código muerto.
8. El popover del dashboard no queda cortado por el borde derecho de la pantalla: al estar el
   chip pegado a la derecha, se ancla por la derecha (`right-0`) en vez de `left-0`.

## Restricciones

- **Mantener la paleta y el estilo actuales.** El chip del dashboard conserva su aspecto exacto
  (tamaño, tokens, icono). El calendario se ve como el de Historial, sin retoques de diseño.
- Sin dependencias nuevas. Sin tocar el back ni la capa de API.
- Si `dateField.css` contiene el tema del calendario, debe seguir cargándose para ambos
  consumidores (moverlo junto al componente compartido si hace falta).
- TDD: test que falla primero.
