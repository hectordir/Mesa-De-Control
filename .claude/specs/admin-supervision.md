# Spec — Admin · Supervisión (Dashboard)

**Slug:** `admin-supervision`
**Fuente de diseño:** Claude Design `Dashboard Admin Supervision.dc.html` → componente `AdminSupervision.dc.html`.
**Objetivo:** Nueva sección **Admin — Supervisión**: vista de auditoría para responsables de la mesa,
con métricas consolidadas del día alimentadas por datos reales de `Gestion`, mapa de incidencias por
zona, bandeja de Nivel 2, SLA por antigüedad, HeatMap y depuración (borrado real) de gestiones.

**Decisiones aprobadas (🚦 ya resueltas):**
1. **Mapa:** instalar `leaflet` + `@types/leaflet` (dependencia nueva aprobada) — capa satelital fiel al diseño.
2. **Alcance de datos:** dashboard real (KPIs, zonas, Bandeja N2, SLA, HeatMap, lista de Depuración) + **borrado real** de gestiones. **UI-local (sin persistir, como en el diseño):** Configuración de Metas, alta/edición de Catálogos de Motivos/Soluciones, e Importador Relámpago.
3. **Acceso:** gatear la sección a rol **ADMIN o SUPERVISOR** (RBAC nuevo en back + guard de rol en front + usuario ADMIN sembrado).

---

## 1. Backend (`mesa-control-back/`)

### 1.1 RBAC reutilizable (pieza nueva, TDD primero)
- `@Roles(...roles: Role[])` decorator (`SetMetadata`) + `RolesGuard` (`CanActivate`) que lee metadata y compara contra `request.user.role`. Devuelve **403** si el rol no aplica; deja pasar si no hay `@Roles` (retrocompatible).
- Se aplica **después** de `JwtAuthGuard` (necesita `request.user`).
- **Test unit:** rol permitido pasa; rol insuficiente → 403; sin `@Roles` → pasa.

### 1.2 Módulo `supervision`
Sigue el patrón de `dashboard` (controller documentado con Swagger + service con `prisma.gestion.groupBy`).
Todos los endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN, Role.SUPERVISOR)`.

#### `GET /supervision/resumen?fecha=YYYY-MM-DD`
`fecha` opcional (default: hoy). DTO de respuesta consolidado:

```ts
SupervisionResumenDto {
  fecha: string;                    // ISO YYYY-MM-DD efectiva
  kpis: {
    atendidosHoy: number;   atendidosDelta: number;      // vs. día anterior
    efectividad: number;    efectividadMeta: number;     // %
    escaladosNoc: number;   escaladosDelta: number;      // vs. día anterior
    slaCumplido: number;    slaMeta: number;             // %
  };
  zonas: { nombre: string; count: number; estado: 'danger'|'warning'|'info'|'success' }[];
  bandejaN2: { id: string; orden: string; abonado: string; zona: string; motivo: string;
               dias: number; estado: string }[];         // gestiones abiertas escaladas a N2/NOC
  sla: { key: string; label: string; count: number }[];  // buckets 0,1,2,3,4+ días
  heatmap: { motivos: string[]; filas: { zona: string; celdas: number[]; total: number }[] };
  depuracion: { id: string; fecha: string; operador: string; abonado: string }[]; // últimas ~20 gestiones
}
```

**Definiciones de métricas** (heurísticas demo; `backend-dev` ajusta el mapeo exacto tras **leer el enum
`ResultadoGestion`** y elegir qué valores son "solucionadas" / "escalado NOC" / "pendiente/abierta"):
- `atendidosHoy` = nº de `Gestion` con `fecha == fechaEfectiva`. `atendidosDelta` = hoy − día anterior.
- `efectividad` = `round(solucionadasHoy / atendidosHoy * 100)`; `efectividadMeta` = 85.
- `escaladosNoc` = nº con `resultado == <escalado NOC>` en la fecha; `escaladosDelta` vs. día anterior.
- `slaCumplido` = `round(cerradasHoy / atendidosHoy * 100)` (cerradas = resultado final, no pendiente/escalado); `slaMeta` = 90.
- `zonas`: `groupBy(ubicacion)` en la fecha → `count`. `estado` por umbral: `>=10 danger`, `>=5 warning`, `>=3 info`, resto `success`.
- `bandejaN2`: `Gestion` **abiertas** (resultado pendiente/escalado a N2/NOC), sin filtrar por fecha; `dias` = díasDesde(`fecha`); `orden` derivado (`#OS-<sufijo id>` o campo si existe); ordenadas por `dias` desc; límite 20.
- `sla`: mismos ítems abiertos, agrupados por `dias` en buckets `0,1,2,3,4+`.
- `heatmap`: `groupBy(ubicacion, motivo)` en la fecha. `motivos` = lista de motivos presentes (orden estable);
  `filas` = una por zona con `celdas[]` alineadas a `motivos` y `total`.
- `depuracion`: últimas ~20 `Gestion` por `createdAt` desc con `fecha`, nombre de operador y `abonado`.

#### `DELETE /supervision/gestiones` (body `{ ids: string[] }`)
Borra en bloque las gestiones indicadas. Valida array no vacío (`DeleteGestionesDto` con `class-validator`).
Devuelve `{ deleted: number }`. **Test e2e:** 200 borra y baja el conteo; array vacío → 400; sin rol → 403; sin JWT → 401.

### 1.3 Seed (`prisma/seed.ts`, idempotente)
- **Usuario ADMIN** `admin@fibex.com` (rol `ADMIN`, pass demo existente `Fibex2026!`). Opcional: un `SUPERVISOR`.
- Asegurar que `gestiones-demo` cubra las **10 zonas de La Guaira** del diseño (Caraballeda, Macuto, La Guaira,
  Maiquetía, Catia La Mar, Naiguatá, Carayaca, El Junko, La Sabana, Chuspa) y motivos variados, con **varias
  gestiones abiertas/escaladas de distintas antigüedades** (0–5 días) para poblar Bandeja N2, SLA y el mapa.
- No romper los seeds existentes (Monitor Diario, Análisis Mensual, Fibex Play).

### 1.4 Verificación backend
`npm run lint`, `npm test` (unit: RolesGuard + supervision.service), `npm run test:e2e` (endpoints + 401/403).

---

## 2. Frontend (`mesa-control-front/`)

### 2.1 Dependencia nueva (🚦 aprobada)
Instalar `leaflet` + `@types/leaflet`. CSS de leaflet importado en el componente del mapa.

### 2.2 Ruteo y navegación con rol
- Activar el ítem **Admin** en `AppTopBar.tsx:14`: `to: '/admin'`. Ocultarlo (o mostrarlo deshabilitado)
  si el rol de la sesión **no** es ADMIN/SUPERVISOR.
- Ruta protegida en `routes/routes.tsx`: `/admin` dentro de `<ProtectedRoute>`, más comprobación de rol
  (nuevo `RoleRoute`/extensión que redirige a la home si el rol no aplica). El rol viene de la sesión
  (`stores/auth.store.ts` / `GET /auth/me`).
- Wrapper fino `src/pages/AdminPage.tsx` → re-exporta `features/admin/AdminPage`.

### 2.3 Estructura de componentes (`src/features/admin/`)
```
AdminPage.tsx                 // orquesta layout; fecha auditoría (estado local) → useSupervision(fecha)
AdminPage.test.tsx
components/
  AdminHeader.tsx             // título + badge Admin + date picker "Fecha Auditoría"
  ZonasMapCard.tsx            // Leaflet satelital + overlay "incidencias por zona" + leyenda
  ResumenOperativo.tsx        // 4 KPI cards (reusa components/ui StatCard/Card donde encaje)
  BandejaNivel2.tsx           // lista de escalados N2 + estado vacío "¡Todo limpio!"
  OrdenesSla.tsx              // SLA por antigüedad + total
  ConfiguracionMetas.tsx      // UI-local: editar/guardar umbrales (no persiste)
  Catalogos.tsx               // Operadores (GET /operadores) + Motivos/Soluciones (UI-local add/toggle/remove)
  ImportadorRelampago.tsx     // UI-local: textarea + "Procesar carga" (no-op, cuenta filas)
  HeatMapDiario.tsx           // tabla zona × motivo con intensidad de color + leyenda
  DepuracionGestiones.tsx     // selección múltiple + borrado real (mutation)
hooks/
  useSupervision.ts           // useQuery GET /supervision/resumen; useMutation DELETE /supervision/gestiones
lib/
  admin.presentation.ts       // helpers de color/tono/intensidad (heatCell, diasColor, estado→hex, coords de zona)
  zonas.geo.ts                // mapa estático nombre→[lat,lng] de parroquias de La Guaira (del diseño)
```
- **Servicio:** `lib/api/supervision.ts` (`fetchSupervisionResumen(fecha)`, `deleteGestiones(ids)`); tipos en `lib/api/types.ts`.
- **Tokens/tema:** usar exclusivamente los tokens Tailwind existentes (`bg`, `surface`, `border(-subtle)`,
  `text-primary/secondary/muted`, `brand`, `success/warning/danger/info`) y `data-theme` claro/oscuro. Sin colores hex sueltos salvo en la capa de presentación (`admin.presentation.ts`) que replica las fórmulas `color-mix` del diseño.
- **Estados:** loading (skeleton), error, y **bandeja vacía** (estado limpio) del diseño (variante `1c`).
- **Coordenadas de zona:** el back envía `count` por `nombre`; el front resuelve lat/lng por nombre vía `zonas.geo.ts`
  (zonas sin coords se listan igual en el overlay, sin marcador).

### 2.4 Interacciones
- Date picker "Fecha Auditoría" → refetch de `useSupervision(fecha)`.
- Depuración: seleccionar filas (individual + "todas") → botón "Eliminar N" → `deleteGestiones` → invalidar query.
- Metas / Catálogos(Motivos,Soluciones) / Importador → **solo estado local** (sin llamadas de red), tal cual el diseño.

### 2.5 Verificación frontend
`npm run lint`, `npm run build`, `npm test` (Vitest). Tests mínimos (TDD, mock de React Query/Axios):
- Render de la page con datos mock: KPIs, zonas, SLA, HeatMap visibles.
- Bandeja N2 **vacía** muestra "¡Todo limpio!".
- Depuración: seleccionar y borrar dispara la mutation con los `ids`.
- Ruta `/admin` con rol OPERADOR redirige; con ADMIN/SUPERVISOR renderiza.

---

## 3. Criterios de aceptación
1. `/admin` accesible solo con rol ADMIN/SUPERVISOR (front redirige, back responde 403 a otros roles; 401 sin JWT).
2. `GET /supervision/resumen?fecha=` responde el DTO completo con datos reales de `Gestion`; cambiar la fecha recalcula.
3. Mapa satelital Leaflet con marcadores de incidencias por zona y overlay de conteos; leyenda de estados.
4. 4 KPI cards, Bandeja N2 (con estado vacío), SLA por antigüedad con total, y HeatMap zona × motivo, todos con datos reales.
5. Depuración: seleccionar gestiones y "Eliminar" las borra realmente (`DELETE`) y refresca la vista.
6. Metas, Catálogos(Motivos/Soluciones) e Importador funcionan como UI local (sin persistir), fieles al diseño.
7. Seed crea usuario ADMIN y datos suficientes (10 zonas, motivos, escalados de varias antigüedades) para poblar todos los paneles.
8. Tema claro/oscuro fiel; responsive a 1 columna; `lint`/`build`/`test` verdes en front y back.

## 4. Fuera de alcance
- Persistencia de Metas y de Catálogos de Motivos/Soluciones (solo UI local).
- Procesamiento real del Importador Relámpago (solo cuenta filas).
- RBAC granular más allá de ADMIN/SUPERVISOR; edición de operadores desde el catálogo (solo lectura de `GET /operadores`).
