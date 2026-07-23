# Spec — Historial General

> Sección "Historial General": la sábana completa de gestiones registradas. Tabla densa con
> header sticky, filtros (búsqueda + rango de fechas + chips por resultado), ordenamiento por
> columna, paginación, drawer de detalle al hacer click en la fila, y vista móvil en tarjetas.
> Fuente de diseño: `Dashboard Historial General.dc.html` (componentes `HistorialGeneral` +
> `HistorialGeneralMobile`).

## Objetivo

Crear la página `/historial` en el front, conectada a un nuevo endpoint de lectura paginada de
gestiones en el back, con datos reales servidos por el seed existente (que ya genera ~248+
gestiones históricas). Fidelidad visual al diseño en modo oscuro y claro, con estados de datos,
vacío y carga.

---

## Alcance

### Incluye
- **Back**: `GET /gestiones` (listado paginado + filtrado + ordenado) que devuelve las filas y
  los contadores por resultado para las chips. Ampliar el modelo `Gestion` con `canal` y
  `duracion` y poblarlos en el seed.
- **Front**: feature folder `features/historial/`, página `HistorialPage`, ruta `/historial`,
  ítem de menú "Historial" en `AppTopBar`, hook de React Query, servicio Axios, y componentes
  (top bar ya existe, tabla, chips, drawer, estados). Vista responsive (tabla → tarjetas).

### No incluye (fuera de alcance, se documenta como TODO)
- Edición de gestión desde el drawer ("Editar gestión" / "Ver abonado" son botones sin acción
  por ahora — navegación futura).
- Persistencia de filtros en URL/localStorage (nice-to-have, no requerido).
- Búsqueda full-text avanzada: basta `contains` case-insensitive sobre abonado/operador/telefono.

---

## Backend

### Cambios de modelo Prisma (`Gestion`)
Añadir dos campos que el diseño muestra pero el modelo no tiene:

- `canal` — enum nuevo `CanalGestion { LLAMADA, WHATSAPP, TELEGRAM }` (nullable u opcional con
  default). Se muestra en el drawer.
- `duracion` — `Int?` en **minutos** (o segundos), para formatear `mm:ss`/`hh:mm` en el drawer.
  Si se prefiere, `String?` con el valor ya formateado; elegir minutos `Int?` (más limpio).

→ Migración nueva + regenerar cliente. **No** alterar el enum `ResultadoGestion` existente (lo
usan monitor-diario y análisis-mensual). El front mapea cada valor del enum a `{label, tone}`
(ver tabla de mapeo abajo). Si el enum actual no cubre los 5 estados del diseño, backend-dev
reporta la discrepancia **antes** de implementar y proponemos el ajuste mínimo.

### Endpoint: `GET /gestiones`
Protegido con `JwtAuthGuard` (como el resto). Sin prefijo global (rutas planas).

**Query params** (todos opcionales, con defaults):
| Param      | Tipo                                   | Default   | Descripción |
|------------|----------------------------------------|-----------|-------------|
| `page`     | int ≥ 1                                | `1`       | Página (1-indexed). |
| `pageSize` | int 1–100                              | `10`      | Filas por página. |
| `search`   | string                                 | —         | `contains` (case-insensitive) sobre abonado, operador (nombre), teléfono. |
| `desde`    | `YYYY-MM-DD`                           | —         | Filtra `fecha >= desde`. |
| `hasta`    | `YYYY-MM-DD`                           | —         | Filtra `fecha <= hasta`. |
| `resultado`| enum `ResultadoGestion`                | —         | Filtra por un resultado (chips). Ausente = todos. |
| `sortKey`  | `fecha\|operador\|abonado\|resultado\|zona` | `fecha` | Columna de orden. |
| `sortDir`  | `asc\|desc`                            | `desc`    | Dirección. |

**Respuesta `200`** (`GestionesListResponseDto`):
```jsonc
{
  "items": [
    {
      "id": "clx…",              // id real de Prisma (string)
      "codigo": "GST-40921",     // id legible; derivar estable a partir del id/secuencia
      "operador": { "id": "…", "nombre": "Jhon Rivas", "iniciales": "JR" },
      "abonado": "Cond. Los Robles",
      "telefono": "0412-118-4420",
      "zona": "Norte",           // = ubicacion
      "canal": "TELEGRAM",       // enum CanalGestion (nullable)
      "resultado": "…",          // valor crudo del enum ResultadoGestion
      "fecha": "2026-07-17",     // YYYY-MM-DD
      "hora": "10:42",           // HH:mm derivado de createdAt
      "duracionMin": 134,        // nullable
      "detalle": "Corte total de fibra…",   // texto (la tabla trunca con CSS)
      "solucion": "Ticket generado a NOC…"  // texto
    }
  ],
  "total": 248,                  // total filtrado (para paginación + "de N")
  "page": 1,
  "pageSize": 10,
  "counts": {                    // conteo por resultado del conjunto filtrado por fecha+search
    "total": 248,                // total (para chip "Todos")
    "porResultado": { "<enumVal>": 84, … }  // groupBy en Postgres, nunca en memoria
  }
}
```

**Reglas**:
- Filtrado/orden/paginación/agrupado **en Postgres** (`where`, `orderBy`, `skip/take`,
  `groupBy`), coherente con el patrón del proyecto (nunca en memoria). Aprovechar índices
  `@@index([fecha])` y `@@index([operadorId, fecha])`.
- `counts.porResultado` se calcula sobre el mismo filtro **excepto** el filtro `resultado`
  (para que las chips muestren los totales de cada categoría, no del subconjunto ya filtrado).
- Orden por `operador` = por `User.name`; por `zona` = por `ubicacion`.
- `codigo` legible (`GST-#####`): derivar de forma **estable y determinista** (p.ej. de un
  campo secuencial o del sufijo del id). Documentar cómo. No debe cambiar entre requests.

### Seed
- El seed ya crea las gestiones históricas. **Poblar** los nuevos campos `canal` y `duracion`
  de forma determinista (PRNG por periodo, como ya se hace) para las gestiones existentes, de
  modo que la tabla y el drawer muestren datos completos. Rango de canales: LLAMADA/WHATSAPP/
  TELEGRAM. Duración: minutos plausibles (p.ej. 2–30 min).
- Verificar que hay suficientes filas para ver paginación (varias páginas de 10).

### Tests (TDD, primero el que falla)
- Unit del service: filtros (search, rango de fechas, resultado), orden por cada `sortKey`,
  paginación (`skip/take`, `total`), y `counts.porResultado` correcto (independiente del filtro
  `resultado`). Mock de `PrismaService`.
- e2e del controller: `GET /gestiones` con y sin params → forma del DTO, guard JWT (401 sin
  token), y casos borde (page fuera de rango → items vacío pero `total` correcto).

---

## Frontend

### Estructura (feature folder, patrón del proyecto)
```
src/features/historial/
  HistorialPage.tsx                     # monta AppTopBar + orquesta estado de filtros
  components/
    HistorialToolbar.tsx                # título + búsqueda + filtro de fechas + Exportar CSV
    ResultadoFilters.tsx                # chips por resultado con contadores
    HistorialTable.tsx                  # tabla densa, header sticky, orden por columna, zebra
    HistorialCards.tsx                  # vista móvil (tarjetas apiladas)
    GestionDrawer.tsx                   # drawer lateral (desktop) / bottom-sheet (móvil)
    ResultadoChip.tsx                   # chip de estado semántico reutilizable
    HistorialPagination.tsx             # paginación
    HistorialEmpty.tsx / HistorialSkeleton.tsx
  hooks/
    useHistorial.ts                     # useQuery (queryKey factory por filtros)
  lib/
    resultado.presentation.ts           # mapeo enum → {label, tone}; helpers de formato
    historial.presentation.ts           # derivaciones puras (iniciales, zebra, csv, etc.)
src/pages/HistorialPage.tsx             # wrapper de 1 línea (re-export)
src/lib/api/historial.ts                # servicio Axios: fetchHistorial(params)
src/lib/api/types.ts                    # + tipos GestionRow, HistorialResponse, HistorialParams
```

### Mapeo de resultado → etiqueta + tono (presentation)
Los 5 estados del diseño (el `tone` mapea a variables ya existentes: success/warning/danger/
info/neutral):

| clave diseño | label                  | tone      |
|--------------|------------------------|-----------|
| mesa         | Solucionado en Mesa    | success   |
| sop          | Enviado a Soporte 2    | warning   |
| noc          | Escalado a NOC         | danger    |
| pend         | Pendiente Cliente      | info      |
| reag         | Reagendado             | neutral   |

El `resultado.presentation.ts` traduce cada valor del enum `ResultadoGestion` (crudo del back)
a esta tabla. Backend-dev confirma los nombres exactos del enum; el orquestador ajusta este
mapeo al integrar.

### Comportamiento
- **Estado de filtros** en la page (search debounced ~300ms, rango de fechas, chip activa,
  sortKey/sortDir, page). Cambios → nueva `queryKey` → refetch. `keepPreviousData` para que la
  tabla no parpadee al paginar.
- **Orden por columna**: click en header de columna ordenable (fecha, operador, abonado,
  resultado, zona) alterna asc/desc; flecha ▲/▼/↕ según estado. Se hace **server-side** (manda
  sortKey/sortDir).
- **Chips**: "Todos" + una por resultado, con contador desde `counts`. Chip activa resaltada
  con su tono.
- **Drawer**: click en fila abre el detalle lateral (desktop) / bottom-sheet (móvil) con los
  datos de esa fila (todos vienen en la respuesta; no hace falta endpoint de detalle). Cierra
  con overlay, botón × y tecla `Esc`. Botones "Editar gestión"/"Ver abonado" presentes pero
  sin acción (TODO documentado).
- **Exportar CSV**: genera CSV del conjunto **de la página actual** (o del resultado filtrado
  si es barato) en cliente y lo descarga. Simple, sin librerías nuevas.
- **Estados**: `isLoading` → skeleton (header + filas shimmer). Sin resultados → estado vacío
  con "Limpiar búsqueda" (resetea filtros) y "Ver todo el mes" (fija rango al mes en curso).
- **Responsive**: en viewport estrecho, la tabla se sustituye por `HistorialCards`
  (tarjetas) y el drawer por bottom-sheet. Usar breakpoints Tailwind (p.ej. `lg:`), no dos
  árboles duplicados de lógica — comparten hook y presentation.
- **Tema**: usar los tokens/variables existentes (dark por defecto, light vía
  `data-theme="light"`). No introducir colores hardcodeados fuera de los tokens.

### UI kit
Reutilizar `Button`, `Badge`, `Card`, `Input` de `src/components/ui/`. `ResultadoChip` puede
apoyarse en `Badge` o ser un componente propio si el diseño lo requiere (chip con punto).

### Tests (TDD, primero el que falla)
- `resultado.presentation.ts`: mapeo enum → label/tone (unit puro).
- `historial.presentation.ts`: iniciales del operador, formato de fecha/hora, generación de CSV,
  zebra (unit puro).
- `HistorialTable`: render de filas, click en header → callback de orden con dir correcta,
  click en fila → callback open, flechas de orden según estado (RTL).
- `ResultadoFilters`: render de chips con contadores, click → callback de filtro.
- `useHistorial`: queryKey correcta según filtros; mock del servicio.
- `HistorialPage`: integración ligera — cambia filtro → nueva query; estados loading/empty.

---

## Criterios de aceptación

1. `GET /gestiones` responde con la forma del DTO especificada; filtra por search/fecha/
   resultado, ordena por cada `sortKey`, pagina, y devuelve `counts.porResultado` correcto
   (independiente del filtro `resultado`). Guard JWT activo. Suites unit + e2e verdes.
2. El seed puebla `canal` y `duracion` en las gestiones históricas; hay ≥ 3 páginas de datos.
3. La ruta `/historial` existe, protegida, con ítem "Historial" activo en `AppTopBar`.
4. La tabla desktop reproduce el diseño: 8 columnas, header sticky, zebra, orden por columna
   con flechas, chips de resultado con tono semántico, paginación, y datos reales del back.
5. Click en fila abre el drawer con el detalle correcto; cierra con ×/overlay/Esc.
6. Estados vacío y de carga (skeleton) presentes y fieles.
7. Vista móvil: tarjetas + bottom-sheet, filtros scrollables. Comparte hook/presentation.
8. Modo oscuro y claro correctos vía tokens. Sin colores hardcodeados fuera de los tokens.
9. Exportar CSV descarga un archivo con las filas visibles. `npm run build` y `npm run lint`
   del front sin errores; suites del front verdes.

---

## Casos borde
- Página fuera de rango → `items: []`, `total` correcto, sin romper la paginación.
- Sin gestiones en el rango → estado vacío (no skeleton infinito).
- Search sin coincidencias → estado vacío.
- Operador sin nombre / campos nullable (`canal`, `duracion`) → el front degrada con guiones/
  vacío sin romper el layout.
- Cambiar de chip mientras se pagina → vuelve a page 1.
- Ordenar por columna resetea a page 1.

## Contrato de tipos (front, en `src/lib/api/types.ts`)
```ts
export type ResultadoGestion = /* unión de los valores del enum del back */ string;
export type CanalGestion = 'LLAMADA' | 'WHATSAPP' | 'TELEGRAM';

export interface GestionRow {
  id: string; codigo: string;
  operador: { id: string; nombre: string; iniciales: string };
  abonado: string; telefono: string; zona: string;
  canal: CanalGestion | null;
  resultado: ResultadoGestion;
  fecha: string; hora: string; duracionMin: number | null;
  detalle: string; solucion: string;
}
export interface HistorialParams {
  page?: number; pageSize?: number; search?: string;
  desde?: string; hasta?: string; resultado?: ResultadoGestion;
  sortKey?: 'fecha' | 'operador' | 'abonado' | 'resultado' | 'zona';
  sortDir?: 'asc' | 'desc';
}
export interface HistorialResponse {
  items: GestionRow[]; total: number; page: number; pageSize: number;
  counts: { total: number; porResultado: Record<string, number> };
}
```
