# Spec — Dashboard · Análisis Mensual (frontend)

**Slug:** `dashboard-analisis-mensual`
**Ámbito:** solo `mesa-control-front`.
**Diseño fuente:** `.claude/specs/design/AnalisisMensual.dc.html`
(pantalla envolvente: `Dashboard Analisis Mensual.dc.html` del proyecto Claude Design
`4d9fdaa5-5635-4df5-a0b2-8b0003609c6a`).

## 1. Objetivo

Segunda vista del Dashboard: **Análisis Mensual**, consolidado por mes. Convive con
`MonitorDiarioPage` bajo el mismo layout (topbar + toggle Monitor Diario / Análisis Mensual).
Reutiliza al máximo lo ya construido en `features/dashboard/` (AppTopBar, ThemeToggle, UserMenu,
KpiCard/StatCard, PanelStates, tokens).

## 2. Ruta y navegación

- Nueva ruta protegida `/dashboard/analisis-mensual` en `src/routes/routes.tsx`.
- La ruta actual `/dashboard` sigue sirviendo Monitor Diario (no romper tests existentes).
- El toggle del header navega entre ambas (`Monitor Diario` → `/dashboard`,
  `Análisis Mensual` → `/dashboard/analisis-mensual`), con el segmento activo marcado según la ruta.
- El mismo toggle debe aparecer **también** en Monitor Diario (componente compartido
  `DashboardViewToggle`), para que la navegación sea bidireccional.

## 3. Estructura de componentes (obligatoria)

```
src/features/dashboard/
  AnalisisMensualPage.tsx            # composición + estados página
  hooks/useAnalisisMensual.ts        # React Query
  hooks/useMonthFilter.ts            # mes seleccionado (YYYY-MM) + label es-VE
  analisis-mensual.derive.ts         # cálculos puros (KPIs, barras, heatmap)
  components/
    DashboardViewToggle.tsx          # Monitor Diario | Análisis Mensual
    MonthFilter.tsx                  # "FILTRO MENSUAL  ▦ Mayo 2026 ▾" (<select> accesible)
    MonthlyKpiCard.tsx               # tarjeta KPI grande (borde izq. de acento, número 52px)
    EffectivenessKpiCard.tsx         # KPI con barra de progreso + marca de meta
    MonthlyBarChart.tsx              # barras apiladas + eje Y + tooltip hover
    MonthlyBarChart.parts.tsx        # (opcional) BarColumn / BarTooltip / ChartLegend
    IncidentHeatmap.tsx              # tabla heatmap con sticky header/col
    HeatmapCell.tsx                  # celda coloreada
    HeatmapSearch.tsx                # buscador de zona
```

Sin dependencias nuevas: el chart y el heatmap se construyen con divs/tabla + Tailwind + tokens CSS,
igual que `DonutChart`/`AveriaBar` en Monitor Diario. **No instalar librerías de gráficos.**

## 4. Contrato de datos

```ts
// src/lib/api/types.ts
export interface AnalisisMensualKpis {
  volumen: number
  resueltos: number
  escalados: number
  metaEfectividad: number      // 0–100, meta de equipo (default 65)
}
export interface AnalisisMensualBar {
  mes: string                  // 'Febrero'
  periodo: string              // '2026-02'
  resueltas: number
  resto: number
}
export interface AnalisisMensualHeatmap {
  motivos: string[]            // columnas
  zonas: { zona: string; valores: number[] }[]  // valores.length === motivos.length
}
export interface AnalisisMensualResponse {
  periodo: string              // 'YYYY-MM'
  kpis: AnalisisMensualKpis
  serie: AnalisisMensualBar[]  // últimos 4 meses, orden cronológico
  heatmap: AnalisisMensualHeatmap
}
```

- Cliente: `getAnalisisMensual(periodo: string)` en `src/lib/api/dashboard.ts`
  → `GET /dashboard/analisis-mensual?periodo=YYYY-MM` (mismo `client` con JWT que monitor-diario).
- Hook: `useAnalisisMensual(periodo)` con React Query, misma convención que `useMonitorDiario`.
- **El endpoint aún NO existe en el back.** Por tanto el hook debe tratar el error de red/404
  como **estado vacío** (no pantalla de error roja) — la UI queda lista para cuando el
  backend publique el endpoint. Es un `TODO` explícito en el código.

## 5. Derivaciones puras (`analisis-mensual.derive.ts`, con tests)

- `efectividad(volumen, resueltos)` → entero redondeado; `0` si `volumen === 0`.
- `metaStatus(efectividad, meta)` → `{ label: 'N pts bajo meta' | 'N pts sobre meta' | '—', tone: 'warning'|'success'|'muted' }`.
- `buildChart(serie)` → `{ yMax, ticks, bars }`:
  `yMax` = techo "bonito" (múltiplo de 450 o similar) ≥ max(total); 5 ticks equiespaciados;
  cada barra con alturas en px sobre `chartH = 300`, `effPct`, y valores formateados `es-VE`.
- `buildHeatmap(heatmap)` → filas con `total`, `maxCell`, `maxTotal`, `grandTotal` y por celda
  la intensidad `t = v / max` (el color se calcula en el componente con
  `color-mix(in srgb, var(--brand) X%, var(--map-bg))`, `X = round((0.16 + t*0.80)*100)`;
  `v <= 0` → `var(--map-bg)` + texto muted; `t > 0.42` → texto claro).
- `filterZones(rows, query)` → filtrado case-insensitive por nombre de zona.
- Formato numérico: `toLocaleString('es-VE')`.

## 6. Estados de la página

| Estado | Disparador | Render |
|---|---|---|
| `loading` | query pendiente | skeletons shimmer en KPIs, 4 barras y 10 filas del heatmap |
| `empty` | sin datos / error de red / mes sin gestiones | KPIs en `0` con número en `--text-muted`; paneles con su empty state (`▥` chart, `▦` heatmap) |
| `data` | respuesta con `kpis.volumen > 0` | vista completa |

Textos exactos de los empty states y de los subtítulos: tomarlos literalmente del diseño.

## 7. Criterios de aceptación

1. `/dashboard/analisis-mensual` protegida; sin sesión redirige a `/login`.
2. El toggle navega en ambos sentidos y marca el segmento activo por ruta.
3. Con datos: 3 KPI cards (Volumen Mensual, Efectividad Global con barra + marca de meta +
   badge "N resueltos", Escalados NOC), chart apilado con leyenda, eje Y y tooltip al hover,
   y heatmap con header/columna sticky, buscador, y pie "N zonas monitoreadas" + total del mes.
4. Buscar una zona filtra las filas; sin coincidencias muestra
   `Ninguna zona coincide con “<query>”.`.
5. Cambiar el mes en `MonthFilter` refetchea con el nuevo `periodo`.
6. Los tres estados (loading / empty / data) renderizan correctamente.
7. Tema claro y oscuro funcionan sin cambios: **solo tokens CSS**, cero colores hardcodeados
   (debe seguir pasando `components/ui/tokens-only.test.ts` si aplica a la carpeta).
8. `npm run lint`, `npm run test` y `npm run build` en verde. Tests existentes intactos.

## 8. Fuera de alcance

- Endpoint backend `GET /dashboard/analisis-mensual` (ticket aparte: `api-analisis-mensual`).
- Exportaciones, drill-down por zona, rango de fechas personalizado.

---

# Revisión 2 — Bloque analítico inferior (frontend)

**Diseño fuente actualizado:** `AnalisisMensual.dc.html` del proyecto Claude Design
`4d9fdaa5-5635-4df5-a0b2-8b0003609c6a` (Claude Design completó la pantalla). Debajo del heatmap
se añaden **7 paneles**. Todos derivan de datos ya presentes en `Gestion` (operador, resultado,
motivo, fecha); no hay cambios de schema. Reutilizar al máximo los componentes de Monitor Diario
(`DonutChart`, `DonutLegend`, `AveriaBar`, `OperatorsPanel`, `PanelStates`).

## R2.1 Contrato de datos (ampliación de `types.ts`)

Se añaden **3 campos** a `AnalisisMensualResponse` (el back los publica en el mismo endpoint):

```ts
export interface AnalisisMensualMotivo {
  motivo: string
  total: number        // gestiones del mes con ese motivo
}
export interface AnalisisMensualOperador {
  id: string
  nombre: string
  solucionados: number  // resultado = SOLUCIONADO_MESA
  enviadosN2: number    // resultado = ENVIADO_SOPORTE2 (Nivel 2)
  total: number         // todas las gestiones del operador en el mes
}
export interface AnalisisMensualDia {
  fecha: string         // 'YYYY-MM-DD'
  atendidos: number     // gestiones de ese día
}
export interface AnalisisMensualResponse {
  periodo: string
  kpis: AnalisisMensualKpis
  serie: AnalisisMensualBar[]
  heatmap: AnalisisMensualHeatmap
  distribucion: AnalisisMensualMotivo[]  // NUEVO — todos los motivos del mes, orden desc por total
  operadores: AnalisisMensualOperador[]  // NUEVO — operadores con gestiones en el mes, orden desc por total
  tendencia: AnalisisMensualDia[]        // NUEVO — solo días con gestiones, orden cronológico
}
```

- `vacioMensual(periodo)` añade `distribucion: [], operadores: [], tendencia: []`.
- Un solo campo `distribucion` alimenta **tres** paneles (donut, barras de clientes atendidos,
  averías recurrentes): son la misma distribución por motivo, presentada distinto.
- Un solo campo `operadores` alimenta **dos** paneles (Solución vs Nivel 2, Top Operadores).

## R2.2 Paneles (orden vertical, tras `IncidentHeatmap`)

Todos dentro del mismo estado de página: `data` los muestra, `empty` muestra **una** tarjeta
"Analítica no disponible" (texto literal del diseño), `loading` muestra 2 tarjetas skeleton.

1. **`RequestDistributionPanel`** — "Distribución de Solicitudes". Donut (`conic-gradient` sobre
   tokens `--c1..--c6`, `--warning/--success/--info/--neutral`, ciclando) + leyenda con `%` por
   motivo; centro = volumen total del mes. Muestra hasta 9 motivos; si hay más, agrupar el resto
   como **"Otros"**. Reutilizar `DonutChart`/`DonutLegend` si encajan; si no, componente análogo.
2. **`AttendedClientsPanel`** — "Total de Clientes Atendidos". Barras verticales (una por motivo,
   top 9) con eje Y de 5 marcas escalado al máximo, valor encima y tooltip al hover.
3. **`SolutionVsN2Panel`** (interactivo) + panel de detalle (grid 2fr/1fr):
   - Izquierda: barras agrupadas Solucionados (`--brand`) vs Enviados N2 (`--c3`) por operador
     (top 6 por total). Click en barra o etiqueta selecciona; el resto baja a `opacity:.4`.
   - Derecha: sin selección → empty "Selecciona un operador…"; con selección → nombre, total,
     3 métricas (Solucionados, Enviados N2, Tasa solución = `round(sol/(sol+n2)*100)%`) y una
     barra de proporción. Estado de selección local (`useState`), no en la URL.
4. **Encabezado de sección "Monitoreo de Flujo Diario"** (barra de acento + título 18px).
5. **`AttentionTrendPanel`** — "Tendencia de Atención Mensual". Área + línea SVG de `tendencia`
   (grid horizontal de 5 marcas, eje Y escalado al máximo "bonito", puntos por día, eje X con las
   fechas `dd/MM`). Grid `2fr/1fr` junto a:
6. **`DailyBreakdownPanel`** — "Desglose de Cantidades". Tabla scrollable (`Fecha` / `Atendidos`)
   con header sticky; una fila por día de `tendencia`, el conteo como "pill" de acento.
7. Grid `1fr/1fr` con:
   - **`TopOperatorsPanel`** — "Top Operadores del Mes". Ranking por **`total` desc** (top 5);
     medalla por puesto (`--warning` #1, `--text-secondary` #2, `#B08D57` #3, `--text-muted` resto),
     `total` gestiones y eficiencia = `round(solucionados/total*100)%`.
   - **`RecurringFailuresPanel`** — "Averías Recurrentes". Top-5 de `distribucion` como barras de
     progreso con `%` sobre el total del mes (reutilizar `AveriaBar`).

## R2.3 Derivaciones puras (añadir a `analisis-mensual.derive.ts`, con tests)

- `buildDistribucion(motivos, { max = 9 })` → `{ label, total, pct, color }[]` con "Otros" si
  sobran; `pct` entero que **suma 100** (repartir el redondeo en el mayor). `donutBg` conic-gradient.
- `buildAtendidos(motivos, { max = 9 })` → barras con `px` sobre alto fijo y `ticks` (máx "bonito").
- `buildOperadores(operadores)` → orden desc por `total`; para Solución-vs-N2, `solPx`/`n2Px` sobre
  un máximo común; para Top, `eficiencia` y `medal`.
- `buildTendencia(dias)` → `linePts`/`areaPts`/`dots`/`grid` (viewBox `0 0 940 250`, y escalado al
  máximo bonito de `atendidos`), etiquetas `dd/MM` y filas de tabla `{ fecha, atendidos }`.
- Reusar `fmt` (`es-VE`). Cero colores hardcodeados salvo `#B08D57` (bronce, no hay token): si
  molesta a `tokens-only.test`, exceptuar ese panel o añadir token `--bronze`.

## R2.4 Criterios de aceptación (además de los de §7)

9. Con datos: los 7 paneles renderizan con los valores del endpoint. La suma de `%` del donut = 100.
10. Solución vs Nivel 2: click en un operador muestra su detalle; volver a click deselecciona.
11. `empty` muestra la tarjeta "Analítica no disponible"; `loading` sus skeletons. Nunca error rojo.
12. Tema claro/oscuro solo con tokens. `lint` + `test` + `build` verdes; tests existentes intactos.
