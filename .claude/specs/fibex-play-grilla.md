# Spec — Fibex Play · Grilla en Vivo

**Slug:** `fibex-play-grilla`
**Origen del diseño:** `Dashboard Fibex Play.dc.html` / `FibexPlay.dc.html` (Claude Design, proyecto `4d9fdaa5…`).
**Estado:** _pendiente de aprobación 🚦_

---

## 1. Objetivo

Crear la sección **Fibex Play** del front, que monitoriza en vivo el estado de la **grilla de
canales TV/streaming**. Una página con:

- **Top bar** existente (habilitar el item "Fibex Play" ya presente pero deshabilitado).
- **Header** con título + subtítulo, toggle segmentado (**Grilla en Vivo** activo / _Gestión de Clientes_
  como placeholder deshabilitado por ahora) y un badge de estado global (verde estable / rojo con caídas).
- **Fila de 3 KPI:** Canales Totales · Salud de Grilla (con anillo) · Canales Caídos.
- **Fila de 2 paneles:** Distribución de Fallas (donut por severidad) · Detalles de Falla (lista).
- **Reporte de Novedades** (timeline en vivo).
- **Dos estados visuales** derivados de los datos: `operativo` (todo sano → tarjetas "estado OK",
  donut 100% estable, panel de éxito) y `fallas` (donut por severidad, lista + timeline de incidencias).

Semántica de color del diseño (no negociable): **verde `--success`** solo para estado sano;
**rojo `--danger`** para caídos; severidades → Crítica=`--danger`, Alta=`--warning`, Media=`--info`.

El estado se **deriva de los datos reales** del backend (no es un prop). Si `caidos === 0` se
muestra el estado operativo; si `caidos > 0`, el estado con fallas.

---

## 2. Backend

### 2.1 Modelo de datos (Prisma)

Nuevo modelo **`Canal`** (snapshot en vivo de la grilla) + enums. Archivo `prisma/schema.prisma`
(enums se importan desde `src/generated/prisma/enums`, según patrón existente).

```prisma
enum CategoriaCanal { DEPORTES INFANTIL NOTICIAS DOCUMENTALES PREMIUM GENERAL MUSICA }
enum EstadoCanal    { OPERATIVO CAIDO }
enum TipoIncidencia { SIN_SENAL VIDEO_PIXELADO IMAGEN_CONGELADA AUDIO_DESINCRONIZADO SENAL_INTERMITENTE }
enum SeveridadIncidencia { CRITICA ALTA MEDIA }

model Canal {
  id             String            @id @default(uuid())
  nombre         String
  categoria      CategoriaCanal
  estado         EstadoCanal       @default(OPERATIVO)
  tipoIncidencia TipoIncidencia?           // solo si estado = CAIDO
  severidad      SeveridadIncidencia?      // solo si estado = CAIDO
  detectadoEn    DateTime?                 // hora de la caída, solo si CAIDO
  orden          Int               @default(0)  // orden de presentación en la grilla
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@index([estado])
}
```

> Decisión de modelado: **snapshot** (estado actual del canal en la propia fila), no histórico de
> incidencias. Es lo que pide una "grilla en vivo". La hora de caída vive en `detectadoEn`.

Requiere **nueva migración** (`prisma migrate dev --name add_canal`). Necesita DB disponible.

### 2.2 Seed (`prisma/seed.ts` + helper `src/seed/canales.ts`)

Determinista e idempotente (ids fijos, `upsert`/`createMany` con `skipDuplicates`, patrón existente):

- **165 canales** en total (coincide con el diseño), repartidos por categoría de forma realista.
- **6 canales caídos** por defecto, replicando el ejemplo del diseño para poblar el estado "fallas"
  (que es el más rico visualmente). Coincidencia exacta:

  | # | Canal | Categoría | Incidencia | Severidad | Hora |
  |---|-------|-----------|-----------|-----------|------|
  | 1 | ESPN | Deportes | Sin señal | Crítica | 09:42 |
  | 2 | Cartoon Network | Infantil | Sin señal | Crítica | 10:07 |
  | 3 | Discovery | Documentales | Video pixelado | Alta | 10:18 |
  | 4 | CNN Español | Noticias | Imagen congelada | Alta | 10:26 |
  | 5 | HBO Max | Premium | Audio desincronizado | Media | 10:39 |
  | 6 | Fox Sports | Deportes | Señal intermitente | Media | 10:51 |

  Los otros 159 canales quedan `OPERATIVO`. `detectadoEn` de los caídos = fecha del seed a esa hora
  (usar fecha base determinista, p.ej. el día de referencia del seed histórico existente).

> Con este seed la página muestra el estado **con fallas** (rico). Para verificar el estado
> **operativo**, basta con que el equipo ponga los 6 canales en `OPERATIVO` (o filtrar el seed).
> No añadimos flags; la página reacciona a los datos reales.

### 2.3 Endpoint

`GET /fibex-play` — protegido (`JwtAuthGuard` + `@ApiBearerAuth('bearerAuth')`), Swagger documentado.
Módulo nuevo `src/fibex-play/` espejo de `src/dashboard/` (module + controller + service + DTOs).

Nunca 404: si no hay canales, devuelve estado vacío (total 0). Agrega en Postgres con `groupBy`/
`findMany` y arma el DTO en memoria (patrón `dashboard.service`).

**Respuesta (`FibexPlayResumenDto`) — API devuelve datos puros, sin colores/glifos (eso es del front):**

```jsonc
{
  "actualizadoEn": "2026-07-22T10:58:00.000Z",   // now() del servidor
  "kpis": {
    "total": 165,
    "operativos": 159,
    "caidos": 6,
    "saludGrilla": 96          // entero %, round(operativos/total*100); 100 si total=0
  },
  "distribucionSeveridad": [   // solo severidades con total > 0, orden Crítica→Alta→Media
    { "severidad": "CRITICA", "total": 2 },
    { "severidad": "ALTA",    "total": 2 },
    { "severidad": "MEDIA",   "total": 2 }
  ],
  "fallas": [                  // canales CAIDO, ordenados por detectadoEn asc (alimenta Detalles + Timeline)
    {
      "id": "…",
      "nombre": "ESPN",
      "categoria": "DEPORTES",
      "tipoIncidencia": "SIN_SENAL",
      "severidad": "CRITICA",
      "hora": "09:42",         // HH:mm derivado de detectadoEn (timezone del servidor)
      "detectadoEn": "2026-07-22T09:42:00.000Z"
    }
  ]
}
```

- `distribucionSeveridad` vacío ⇒ front muestra "Grilla 100% estable".
- `fallas` vacío ⇒ front muestra estados "Sin detalles" / panel de éxito.

### 2.4 Tests (TDD, primero el que falla)

- **Unit** `src/fibex-play/fibex-play.service.spec.ts` — mock `PrismaService` (`canal.count`,
  `canal.groupBy`, `canal.findMany`). Verifica: cálculo de `saludGrilla` (round), `caidos`/`operativos`,
  distribución solo con severidades presentes y en orden, `fallas` ordenadas por `detectadoEn`,
  formato `hora` HH:mm, y caso `total=0` → saludGrilla 100 y arrays vacíos.
- **e2e** `test/fibex-play.e2e-spec.ts` — `401` sin token, `200` + forma exacta del body con token
  (login real, PrismaService mockeado como en `dashboard.e2e-spec.ts`).

---

## 3. Frontend

### 3.1 Estructura de componentes (feature-first, ordenada)

```
src/features/fibex-play/
  FibexPlayPage.tsx                 # orquesta estado loading|error|empty|data
  hooks/
    useFibexPlay.ts                 # useQuery(['fibex-play'], fetchFibexPlay)
  components/
    FibexPlayHeader.tsx             # título + toggle segmentado + badge estado
    GrillaKpiRow.tsx                # contenedor de las 3 KPI
    KpiCanalesTotales.tsx
    KpiSaludGrilla.tsx             # incluye el anillo (conic-gradient)
    KpiCanalesCaidos.tsx
    DistribucionFallasPanel.tsx     # donut severidad / estado 100% estable
    DetallesFallaPanel.tsx          # lista de caídos / estado "Sin detalles"
    NovedadesPanel.tsx              # timeline en vivo / panel de éxito
    HealthRing.tsx                  # anillo reutilizable (conic-gradient)
    SeverityDonut.tsx               # donut reutilizable (conic-gradient por segmentos)
  lib/
    fibexPlay.presentation.ts       # mapas enum→label/color/glifo (SEVERIDAD_COLOR, INCIDENCIA_LABEL, CATEGORIA_LABEL)
src/pages/FibexPlayPage.tsx         # wrapper fino (patrón existente)
src/lib/api/fibex-play.ts           # fetchFibexPlay() con api.get('/fibex-play')
src/lib/api/types.ts                # + tipos FibexPlayResumen, FallaCanal, etc. (o archivo dedicado)
```

- **Presentación en el front:** el mapeo enum→etiqueta legible ("SIN_SENAL"→"Sin señal",
  "DEPORTES"→"Deportes") y enum→color/glifo vive en `fibexPlay.presentation.ts`. Se usan las clases
  Tailwind/tokens existentes (`bg-surface`, `text-text-primary`, `text-success`, `text-danger`,
  `text-warning`, `text-info`, `border-border`, etc.) — **sin estilos inline con `var(--…)`**; el
  diseño `.dc.html` es referencia visual, se traduce a las clases del proyecto.
- Anillo y donut con `conic-gradient` (equivalente al diseño), envueltos en `HealthRing`/`SeverityDonut`.
- Estado derivado: `resumen.kpis.caidos > 0` ⇒ modo fallas; `=== 0` ⇒ modo operativo.

### 3.2 Routing + navegación

- `src/routes/routes.tsx` — nueva ruta protegida `/fibex-play` → `<ProtectedRoute><FibexPlayPage/></ProtectedRoute>`.
- `src/features/dashboard/components/AppTopBar.tsx:13` — cambiar el item `Fibex Play` de `to: null`
  a `to: '/fibex-play'` para habilitarlo en la nav.

### 3.3 Data-fetching

- `src/lib/api/fibex-play.ts`: `fetchFibexPlay()` → `api.get<FibexPlayResumen>('/fibex-play')`.
  Ante error/404 degradar a estado vacío (patrón `fetchAnalisisMensual`) para no romper mientras
  se levanta el back.
- `useFibexPlay.ts`: `useQuery({ queryKey: ['fibex-play'], queryFn: fetchFibexPlay })`.

### 3.4 Tests (TDD, primero el que falla)

- `AppTopBar.test.tsx` (o ampliar existente): el item Fibex Play ahora enlaza a `/fibex-play`.
- `routes.test.tsx`: `/fibex-play` monta la página (protegida → redirige a login sin sesión).
- `FibexPlayPage.test.tsx`: con datos mock (React Query), renderiza los 3 KPI, y **según `caidos`**
  muestra el modo fallas (lista + timeline + donut severidad) o el modo operativo (paneles de éxito).
  Verifica el cálculo visible de salud y el conteo de caídos.
- Tests de al menos un componente puro clave (p.ej. `KpiSaludGrilla` con distintos %).

---

## 4. Criterios de aceptación

1. `GET /fibex-play` responde `200` con el DTO especificado (con token) y `401` sin token; documentado en Swagger.
2. `saludGrilla` = `round(operativos/total*100)`; con `total=0` ⇒ `100` y arrays vacíos.
3. `distribucionSeveridad` solo incluye severidades con `total>0`, en orden Crítica→Alta→Media;
   `fallas` ordenadas por `detectadoEn` ascendente con `hora` en formato `HH:mm`.
4. El seed crea 165 canales (6 caídos con los datos de la tabla) de forma idempotente.
5. La página `/fibex-play` renderiza top bar + header + 3 KPI + 2 paneles + novedades, fiel al diseño,
   con soporte dark/light vía tokens, y alterna correctamente entre estado operativo y con fallas
   según los datos.
6. El item "Fibex Play" queda habilitado y activo en la nav al estar en la ruta.
7. Verde `--success` **solo** para estado sano; rojo `--danger` para caídos; severidades con el mapa
   de color especificado.
8. Todas las suites (Vitest front, Jest unit + e2e back) en verde. Lint limpio.

---

## 5. Fuera de alcance

- La vista **Gestión de Clientes** (toggle) — placeholder deshabilitado; se implementará con
  `Dashboard Fibex Play Gestion.dc.html` en un ticket aparte.
- Actualización automática en tiempo real (websockets/polling). Por ahora, refetch de React Query
  al montar/refocus con los defaults del proyecto.
- Mutaciones (marcar canal como resuelto, etc.).
