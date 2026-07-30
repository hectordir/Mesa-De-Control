# Spec — Monitor Diario: paneles de igual altura, scroll de operadores, Telegram fuera

**Alcance:** sólo `mesa-control-front`. El backend **no se toca** (decisión explícita del usuario).
Sin dependencias nuevas.

## Contexto

- `features/dashboard/MonitorDiarioPage.tsx:13-14` — clase de rejilla compartida por las dos filas
  de paneles (`:46` Operadores + Distribución, `:57` Top averías + Radar):
  `grid grid-cols-[repeat(auto-fit,minmax(360px,1fr))] items-start gap-4`.
  **`items-start` es la causa del desorden**: anula el `stretch` por defecto del grid, así que cada
  panel mide lo que mide su contenido.
- `features/dashboard/components/PanelStates.tsx:20,33` — `Panel`, el wrapper que usan **todos** los
  paneles del dashboard. `<section className="flex flex-col overflow-hidden rounded-card border
  border-border bg-surface shadow-elevation">`. Props: `titulo`, `subtitulo`, `estado`, `accion?`,
  `pie?`, `children`. No acepta `className`.
- `components/OperatorsPanel.tsx` / `OperatorsTable.tsx:53` — la tabla crece libremente: sin
  `max-h-`, sin `overflow-y-auto`. No hay ningún corte de filas ni en front ni en back.
- Precedente de scroll en el mismo proyecto: `DailyBreakdownPanel.tsx:17`
  (`am-scroll max-h-[270px] overflow-auto`) y `IncidentHeatmap.tsx:70`.
- `OperatorsPanel.tsx:37-45` — botón "Generar reporte Telegram" dentro del prop `pie`. Ya está
  `disabled`, sin `onClick`; es un placeholder.

## Objetivo 1 — Convención: paneles de la misma fila, misma altura

**Criterios de aceptación**

1. Se elimina `items-start` de la clase de rejilla de `MonitorDiarioPage.tsx:13-14`, de modo que
   el grid estire los paneles de cada fila a la altura del más alto (`stretch` por defecto).
2. `Panel` (`PanelStates.tsx:33`) añade `h-full` a su `<section>` para ocupar la celda completa.
   Al ser el wrapper común, la convención queda aplicada de una vez a todos los paneles del
   dashboard, no sólo a estos dos.
3. Aplica a **ambas filas** de la página (Operadores+Distribución y Top averías+Radar).
4. El contenido de los paneles que quedan "cortos" (la dona) no se deforma ni se estira: se
   mantiene su tamaño natural, centrado verticalmente en el espacio disponible.
5. Test: ambos paneles de una fila comparten la clase que produce el estiramiento y `Panel`
   expone `h-full`; el contenedor de la rejilla ya no tiene `items-start`.

**Nota de visibilidad (reportar al usuario):** igualar alturas implica que el panel de la dona
queda con espacio libre bajo la leyenda, proporcional a lo alta que sea la tabla de operadores.
Es el precio de la simetría pedida; se mitiga con el tope de altura del Objetivo 2.

## Objetivo 2 — La tabla de operadores se muestra completa, con scroll propio

**Criterios de aceptación**

1. El cuerpo de la tabla vive en un contenedor con `overflow-y-auto` y un tope de altura, usando
   la clase `am-scroll` ya existente en el proyecto para que la barra de scroll siga el tema.
2. **Se renderizan todas las filas que devuelve la API** — no se recorta la lista, sólo se hace
   scroll sobre ella. (Recordatorio: el back sólo devuelve operadores con gestiones ese día; eso
   NO se cambia en este ticket.)
3. La cabecera de la tabla (`OPERADOR / CLIENTES / MESA / SOP. 2 / NOC`) permanece visible al
   hacer scroll (`sticky top-0` con fondo del tema, sin transparencias que dejen ver las filas).
4. La fila de **TOTAL** permanece visible y **fuera** del área que hace scroll: es un resumen, no
   debe perderse al desplazarse.
5. El buscador de operador sigue funcionando: al filtrar, el scroll se ajusta al resultado.
6. Tests: con una lista larga de operadores se renderizan todas las filas; el contenedor de scroll
   tiene `overflow-y-auto`; la cabecera es `sticky`; la fila TOTAL no está dentro del contenedor
   scrollable.

## Objetivo 3 — Botón "Generar reporte Telegram" comentado

**Criterios de aceptación**

1. El botón se **comenta** (no se borra) en `OperatorsPanel.tsx:37-45`, con una nota breve de por
   qué: uso incierto, pendiente de decisión. Debe ser trivial reactivarlo.
2. Si al comentarlo el prop `pie` del `Panel` queda vacío, no debe renderizarse un pie vacío con
   borde/padding colgando: se omite el `pie` por completo.
3. `MonitorDiarioPage.test.tsx:323-329` (`deja el reporte de Telegram fuera de alcance
   (deshabilitado)`) deja de aplicar: sustitúyelo por una aserción de que el botón **no está
   presente** (`queryByRole(...)` → `toBeNull()`), para que quede constancia de la decisión.

## Restricciones

- **Mantener la paleta y el estilo actuales**: sólo tokens Tailwind ya presentes. Nada de hex
  nuevos, ni cambios de tipografía, radios o sombras.
- Sin dependencias nuevas. Sin tocar `mesa-control-back` ni la capa de API del front.
- TDD: test que falla primero en cada objetivo.
