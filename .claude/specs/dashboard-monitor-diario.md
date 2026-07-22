# Spec — Dashboard · Monitor Diario

**Slug:** `dashboard-monitor-diario` · **Dominio:** `mesa-control-front` · **Estado:** 🚦 pendiente de aprobación

Diseño fuente: [`.claude/specs/design/MonitorDiario.dc.html`](design/MonitorDiario.dc.html)
(copia fiel de `MonitorDiario.dc.html` del proyecto Claude Design; el wrapper
`Dashboard Monitor Diario.dc.html` solo lo muestra en 4 variantes: dark+data, light+data,
dark+empty, dark+loading — es decir, **el mismo componente en 3 estados y 2 temas**).

## Objetivo

Sustituir el placeholder `src/pages/DashboardPage.tsx` por la vista **Monitor Diario** completa,
fiel al diseño, en tema oscuro y claro, con los tres estados (`data` / `empty` / `loading`),
construida sobre las primitivas y tokens ya existentes y conectada a una **capa de datos con
React Query** lista para apuntar a la API real.

## Alcance de la conexión al backend

Hoy el back solo expone `POST /auth/login` y `GET /auth/me`. **No existe ningún endpoint de
gestiones.** Por tanto:

- **Se conecta de verdad:** identidad y sesión — iniciales del avatar y nombre desde el store
  `useAuthStore`, botón **Salir** que limpia sesión y navega a `/login`. La página vive detrás de
  `ProtectedRoute`.
- **Se deja cableado pero servido por fixtures:** los datos del dashboard. Se define el contrato
  TypeScript y un único módulo adaptador `src/lib/api/dashboard.ts` que hoy resuelve desde
  `src/features/dashboard/fixtures.ts` (los mismos números del diseño) y mañana hace la llamada
  HTTP real. **Cambiar a la API real debe tocar solo ese archivo.**
- **Fuera de alcance en este ticket:** implementar los endpoints en NestJS, el botón
  "Generar reporte Telegram" (renderiza y es `disabled`/no-op documentado), el selector de fecha
  real (el chip muestra la fecha de operación y "Volver a hoy" la resetea a hoy, sin datepicker),
  el buscador de operador (filtra en cliente sobre los datos ya cargados), y las pestañas de
  empresa / navegación a otras páginas (son enlaces inertes salvo Dashboard).

## Contrato de datos

```ts
// src/lib/api/types.ts (ampliar)
export type ResultadoGestion =
  | 'SOLUCIONADO_MESA' | 'ENVIADO_SOPORTE2' | 'ESCALADO_NOC'
  | 'PENDIENTE_CLIENTE' | 'REAGENDADO';

export interface KpiResumen {
  clientesAtendidos: number;
  efectividadMesa: number;    // 0–100
  enviadoSoporte2: number;
  escaladoNoc: number;
  pendienteCliente: number;
}

export interface OperadorResumen {
  id: string; nombre: string;
  clientes: number; mesa: number; soporte2: number; noc: number;
  // `iniciales` y `efectividad` se DERIVAN en el front (efectividad = round(mesa/clientes*100)),
  // no viajan por la API.
}

export interface DistribucionItem { resultado: ResultadoGestion; total: number }
export interface AveriaItem { motivo: string; total: number }
export interface ActividadItem {
  id: string; operador: string; resultado: ResultadoGestion;
  ubicacion: string; hora: string;              // ISO 8601
}

export interface MonitorDiarioResumen {
  fecha: string;                                 // YYYY-MM-DD
  kpis: KpiResumen;
  operadores: OperadorResumen[];
  distribucion: DistribucionItem[];
  topAverias: AveriaItem[];                      // ya ordenado desc, máx 5
  actividad: ActividadItem[];                    // ya ordenado desc por hora
}
```

Endpoint previsto (aún no implementado): `GET /dashboard/monitor-diario?fecha=YYYY-MM-DD`.

**Reglas de derivación en el front** (no en fixtures ni en API):
- `efectividad = Math.round(mesa / clientes * 100)`; si `clientes === 0` → `0`.
  Color `success` si `>= 75`, `warning` si no.
- Totales de la fila **Total** = suma de columnas.
- `%` del donut = `total / suma(totales) * 100`, 1 decimal; el centro muestra la suma.
- Ancho de barra en Top 5 Averías = `total / max(totales) * 100`.
- Iniciales = primera letra de las dos primeras palabras del nombre, en mayúscula.
- Etiquetas de `ResultadoGestion` → texto y color de serie (`c1…c5`) en un único mapa
  `resultadoMeta` reutilizado por donut y radar.

**Estados:** `loading` = query `isPending`. `empty` = respuesta OK con
`kpis.clientesAtendidos === 0` (KPIs en `0`/`0%` con `text-text-muted` y su `emptyMeta`, y cada
panel con su vacío propio). `data` = el resto. Un error de red muestra un estado de error con
botón **Reintentar** (no está en el diseño; usar tono `danger` y las primitivas existentes).

## Estructura de componentes

```
src/features/dashboard/
  MonitorDiarioPage.tsx          # orquesta layout + hook de datos
  fixtures.ts                    # datos del diseño (temporal, sustituible por la API)
  resultado.ts                   # mapa etiqueta/color por ResultadoGestion
  hooks/useMonitorDiario.ts      # React Query: queryKey ['monitor-diario', fecha]
  hooks/useOperationDay.ts       # fecha de operación + "volver a hoy" + formatos es-VE
  components/
    AppTopBar.tsx                # marca, selector de empresa, nav, toggle de tema, usuario, Salir
    ThemeToggle.tsx              # alterna data-theme dark/light en <html>
    UserMenu.tsx                 # avatar con iniciales del usuario autenticado + Salir
    PageHeader.tsx               # título + segmented (Monitor/Análisis) + control de fecha
    OperationDatePicker.tsx      # chip de fecha + "Volver a hoy"
    KpiRow.tsx  KpiCard.tsx
    OperatorsPanel.tsx  OperatorsTable.tsx  OperatorSearch.tsx
    DistributionPanel.tsx  DonutChart.tsx  DonutLegend.tsx
    TopAveriasPanel.tsx  AveriaBar.tsx
    RadarPanel.tsx  RadarItem.tsx
    PanelStates.tsx              # EmptyState / SkeletonRows reutilizables
    icons.tsx
```

`src/pages/DashboardPage.tsx` pasa a re-exportar/renderizar `MonitorDiarioPage`; la ruta
`/dashboard` no cambia. `AppTopBar` vive en `features/dashboard/components` por ahora; si otra
página lo necesita se promueve a `src/components/layout/` en un ticket posterior.

## Fidelidad visual

- **Solo clases mapeadas a tokens** (`bg-surface`, `text-text-muted`, `border-border`, …).
  Prohibido hex crudo y clases de la paleta Tailwind por defecto — igual que en `login`.
  Si el diseño usa una opacidad (`color-mix(… 12% …)`, `20%`, `22%`, `18%`) se resuelve como
  **token derivado** en `tokens.css`, como ya se hizo en el ticket de acceso, para que el tema
  claro funcione sin ramas condicionales.
- Series de gráfico `--c1…--c6`: exponerlas como utilidades de token si aún no lo están.
- El donut es un `conic-gradient` calculado desde los datos (sin librería de charts).
- Animaciones `fx-shimmer` (skeletons) y `fx-pulse` (punto "En vivo") van en `index.css`
  bajo `@layer utilities` o como keyframes de Tailwind, no inline.
- Reutilizar `Card`, `Button`, `Badge`, `Input` de `src/components/ui` donde encajen; si el diseño
  pide una variante que la primitiva no tiene, **ampliar la primitiva** en vez de duplicar estilos.
- Responsive: las dos rejillas usan `auto-fit / minmax(190px|360px, 1fr)`; conservar ese
  comportamiento con utilidades de Tailwind.

## Accesibilidad

- La tabla de operadores es una `<table>` real con `<th scope="col">`.
- El segmented control y las pestañas de empresa usan `role="tablist"`/`aria-selected` o botones
  con `aria-pressed`; el elemento activo es distinguible sin depender solo del color.
- El toggle de tema tiene `aria-label` y refleja el estado.
- El buscador de operador tiene `<label>` asociado (puede ser visualmente oculto).
- Skeletons marcados con `aria-hidden` y el contenedor con `aria-busy="true"`.

## Criterios de aceptación

1. `npm run build`, `npm run lint` y `npm test` pasan sin errores ni warnings nuevos.
2. Tests RTL escritos **antes** del componente, como mínimo:
   - `MonitorDiarioPage` con datos: muestra los 5 KPIs con sus valores, los 5 operadores, la fila
     **Total** con las sumas correctas, las 5 leyendas del donut con su `%`, las 5 averías y las
     5 entradas del radar.
   - Estado `loading`: hay skeletons (`aria-busy`) y **no** hay valores numéricos de KPI.
   - Estado `empty`: KPIs en `0`/`0%` y los tres textos vacíos ("Aún no hay gestiones hoy",
     "Sin gestiones para graficar", "Sin averías registradas hoy", "Sin actividad reciente").
   - Estado de error: mensaje + botón **Reintentar** que reintenta la query.
   - `efectividad`: test unitario de la derivación, incluido `clientes === 0`.
   - `UserMenu`: muestra las iniciales del usuario del store; **Salir** limpia sesión y navega a
     `/login`.
   - `OperatorSearch` filtra las filas por nombre.
   - `ThemeToggle` alterna `data-theme` en `<html>`.
3. El test de "solo tokens" existente se amplía (o se añade uno equivalente) para cubrir
   `src/features/dashboard/`.
4. Verificación visual en navegador (`npm run dev`, sesión iniciada): `/dashboard` reproduce el
   diseño en `data-theme="dark"` y en `light`, sin scroll horizontal a 1280 px y con las rejillas
   reflowing correctamente a ~900 px.

## Dependencias nuevas

**Ninguna.** React Query, Zustand, Axios, React Router, Vitest y RTL ya están instalados.
Si el especialista considera imprescindible una librería de charts, **debe parar y pedir
aprobación** — el diseño no la necesita (donut = `conic-gradient`, barras = divs).
