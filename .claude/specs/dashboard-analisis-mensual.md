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
