# Spec — Fibex Play · Gestión de Clientes

**Slug:** `fibex-play-gestion`
**Origen del diseño:** `FibexPlayGestion.dc.html` (Claude Design, proyecto `4d9fdaa5…`).
**Depende de:** `fibex-play-grilla` (ya implementado).
**Estado:** _pendiente de aprobación 🚦_

---

## 1. Objetivo

Segunda vista de la sección **Fibex Play**, accesible desde el toggle segmentado del header
(**Grilla en Vivo** ↔ **Gestión de Clientes**). Es la **bitácora de atención a reportes de clientes
por la App Fibex**. Contiene:

- **Header** con título "Fibex Play — Gestión de Clientes", subtítulo, y el mismo **toggle segmentado**
  (ahora "Gestión de Clientes" activo).
- **Fila de 3 KPI:** Total Atendidos · Solucionados · Escalados.
- **Fila de 2 paneles:** Top Canales Reportados (App Fibex) · Origen del Problema (donut).
- **Bitácora de Atención App:** tabla de registros + botón **Nuevo Registro** (arriba a la derecha)
  que abre un **drawer** (modal lateral) con el formulario de alta.

Semántica de color (del diseño): Total=`--brand`, Solucionado=`--success`, En proceso=`--warning`,
Escalado=`--danger`. Paneles usan la paleta categórica `--c1..c6`.

### Decisiones de producto (confirmadas)
- El **Estado** (Solucionado / En proceso / Escalado) es un **campo del formulario** → de ahí salen las KPIs.
- El **Origen del Problema** se **deriva del Motivo** vía un mapeo fijo (no es campo del form).
- La bitácora soporta **crear + listar** (sin borrado). El botón/modal de borrar del diseño queda fuera de alcance.

---

## 2. Backend

### 2.1 Modelo de datos (Prisma)

Nuevo modelo **`AtencionApp`** + enum de estado. Archivo `prisma/schema.prisma`.

```prisma
enum EstadoAtencion { SOLUCIONADO EN_PROCESO ESCALADO }

model AtencionApp {
  id         String         @id @default(uuid())
  operador   User           @relation(fields: [operadorId], references: [id])
  operadorId String
  abonado    String                       // "Número de abonado" (texto: nombre/condominio/nº cuenta)
  canal      String                       // valor del catálogo de canales
  motivo     String                       // valor del catálogo de motivos
  solucion   String                       // valor del catálogo de soluciones
  estado     EstadoAtencion
  creadoEn   DateTime       @default(now())

  @@index([estado])
  @@index([canal])
}
```

> `origen` NO se persiste: se deriva de `motivo` en el service (mapa único, testeable).
> `User` gana la relación inversa `atenciones AtencionApp[]`.

Requiere **nueva migración** (`prisma migrate dev --name add_atencion_app`).

### 2.2 Catálogos (constantes del backend, `src/fibex-play/gestion/catalogos.ts`)

Fuente única de verdad; se exponen al front para poblar los selects.

- **Canales (10 dummy):** `ESPN`, `Cartoon Network`, `HBO Max`, `Discovery`, `CNN Español`,
  `Fox Sports`, `Nat Geo`, `TNT`, `Warner Channel`, `Universal TV`.
- **Motivos → Origen** (mapa que alimenta el panel Origen del Problema):
  | Motivo | Origen |
  |--------|--------|
  | Sin señal | Señal / Transmisión |
  | Video congelado | Señal / Transmisión |
  | Audio desfasado | Señal / Transmisión |
  | Cortes / buffering | Señal / Transmisión |
  | App no carga | App / Login |
  | Error de login | App / Login |
  | Suscripción vencida | Cuenta / Pago |
  | Error de facturación | Cuenta / Pago |
  | Dispositivo no compatible | Dispositivo |
  | Falla del decodificador | Dispositivo |
- **Soluciones:** `Reinicio de la app`, `Reset de credenciales`, `Recarga de guía / EPG`,
  `Reinicio de ONU`, `Verificación de pago`, `Escalar a NOC`.
- **Estados:** `SOLUCIONADO`, `EN_PROCESO`, `ESCALADO`.

### 2.3 Seed (`prisma/seed.ts` + helper `src/seed/atenciones.ts`)

Determinista e idempotente (ids fijos `atencion-0001…`, `createMany` skipDuplicates). ~**24 registros**
usando operadores ya sembrados (relación por `operadorId`), con distribución que produzca paneles ricos:

- **Estados:** 16 Solucionado · 5 En proceso · 3 Escalado (KPIs: total 24 / solucionados 16 / escalados 3).
- **Top canales** (aprox., orden desc): ESPN 6 · Cartoon Network 5 · HBO Max 4 · Discovery 3 · CNN Español 3 · resto 3.
- **Origen** (derivado del motivo): Señal/Transmisión, App/Login, Cuenta/Pago, Dispositivo — todas con ≥1.
- `creadoEn` con fechas base deterministas (no `now()`), para orden estable descendente.

### 2.4 Endpoints (módulo `src/fibex-play/gestion/`)

Ambos protegidos (`JwtAuthGuard` + `@ApiBearerAuth('bearerAuth')`), Swagger documentado. Nunca 404:
sin registros → KPIs en 0, arrays vacíos, catálogos siempre presentes.

**`GET /fibex-play/gestion`** → `GestionResumenDto`:

```jsonc
{
  "kpis": { "totalAtendidos": 24, "solucionados": 16, "enProceso": 5, "escalados": 3 },
  "topCanales": [                       // desc por total, top 5
    { "canal": "ESPN", "total": 6 },
    { "canal": "Cartoon Network", "total": 5 }
  ],
  "origen": [                           // por categoría con total>0, orden fijo del catálogo
    { "origen": "Señal / Transmisión", "total": 10 },
    { "origen": "App / Login", "total": 6 },
    { "origen": "Cuenta / Pago", "total": 5 },
    { "origen": "Dispositivo", "total": 3 }
  ],
  "registros": [                        // desc por creadoEn
    {
      "id": "…",
      "operador": "Jhon Rivas",
      "abonado": "Cond. Los Robles",
      "canal": "ESPN",
      "motivo": "Sin señal",
      "solucion": "Reinicio de ONU",
      "estado": "SOLUCIONADO",
      "creadoEn": "2026-07-22T14:12:00.000Z"
    }
  ],
  "catalogos": {
    "canales": ["ESPN", "…"],           // 10
    "motivos": ["Sin señal", "…"],      // 10
    "soluciones": ["Reinicio de la app", "…"],
    "estados": ["SOLUCIONADO", "EN_PROCESO", "ESCALADO"]
  }
}
```

> Los **operadores** del select del form se toman del endpoint existente `GET /operadores`
> (reutilizar; no duplicar). No se incluyen en `catalogos`.

**`POST /fibex-play/gestion`** — crea un registro. Body `CrearAtencionDto` (class-validator):

```jsonc
{ "operadorId": "uuid", "abonado": "string(1..120)", "canal": "IsIn(catálogo)",
  "motivo": "IsIn(catálogo)", "solucion": "IsIn(catálogo)", "estado": "IsEnum(EstadoAtencion)" }
```

- `201` con el registro creado (forma de un item de `registros`).
- `400` si falla validación (canal/motivo/solución fuera de catálogo, estado inválido, abonado vacío).
- `404`/`400` si `operadorId` no existe (validar existencia → 400 con mensaje claro).
- `401` sin token.

### 2.5 Tests (TDD, primero el que falla)

- **Unit** `gestion.service.spec.ts` — mock Prisma (`atencionApp.count`/`groupBy`/`findMany`,
  `user.findUnique`). Cubre: KPIs por estado, `topCanales` orden desc + top 5, derivación
  motivo→origen y agregación por categoría en orden del catálogo, `registros` desc por `creadoEn`,
  caso vacío (0 y arrays vacíos, catálogos presentes), y en POST: rechazo de operador inexistente
  y derivación/persistencia correcta.
- **e2e** `test/fibex-play-gestion.e2e-spec.ts` — `GET`: 401 sin token, 200 forma exacta.
  `POST`: 401 sin token, 400 con body inválido (canal fuera de catálogo / estado inválido / sin abonado),
  201 con body válido devolviendo el registro. PrismaService mockeado (patrón `dashboard.e2e-spec`).

---

## 3. Frontend

### 3.1 Toggle compartido + routing

- Nueva ruta protegida **`/fibex-play/gestion`** en `src/routes/routes.tsx`.
- La ruta existente `/fibex-play` (Grilla) no cambia de path.
- El **toggle segmentado** del header pasa a ser navegación real entre ambas vistas. Extraer
  `src/features/fibex-play/components/FibexPlayToggle.tsx` (dos `NavLink`: "Grilla en Vivo"→`/fibex-play`
  con punto pulsante, "Gestión de Clientes"→`/fibex-play/gestion`). Usarlo en **ambos** headers
  (reemplaza el toggle inline de la Grilla, donde hoy "Gestión de Clientes" está deshabilitado).
- `AppTopBar`: el item "Fibex Play" debe quedar **activo para `/fibex-play` y `/fibex-play/gestion`**
  (match por prefijo, no `end`).

### 3.2 Estructura de componentes (feature-first, ordenada)

```
src/features/fibex-play/
  components/FibexPlayToggle.tsx        # NUEVO, compartido por ambas vistas
  gestion/
    FibexPlayGestionPage.tsx            # orquesta loading|data (degrada a vacío)
    hooks/
      useFibexPlayGestion.ts            # useQuery(['fibex-play-gestion'], fetchGestion)
      useCrearAtencion.ts               # useMutation(POST) + invalidate ['fibex-play-gestion']
    components/
      GestionKpiRow.tsx                 # 3 KPI (Total/Solucionados/Escalados)
      GestionKpiCard.tsx                # tarjeta KPI reutilizable (label/valor/icono/color)
      TopCanalesPanel.tsx               # ranking con barras de progreso
      OrigenProblemaPanel.tsx           # donut (SeverityDonut/DonutChart reutilizable) + leyenda
      BitacoraPanel.tsx                 # header con botón "Nuevo Registro" + tabla (o estado vacío)
      BitacoraTabla.tsx                 # tabla desktop (scroll-x)
      NuevoRegistroDrawer.tsx           # drawer lateral con el formulario
    lib/
      gestion.presentation.ts           # ESTADO_LABEL/COLOR, ORIGEN_COLOR, iniciales, mapa de barras
src/pages/FibexPlayGestionPage.tsx      # wrapper fino
src/lib/api/fibex-play-gestion.ts       # fetchFibexPlayGestion() + crearAtencion(payload)
src/lib/api/types.ts                    # + tipos GestionResumen, RegistroAtencion, EstadoAtencion, etc.
```

- Reutilizar el donut existente (`DonutChart`/`SeverityDonut`) para Origen del Problema.
- Traducir el diseño a **clases Tailwind/tokens** (sin `var(--…)` inline salvo dentro de strings de
  `conic-gradient`/gradiente, como el precedente ya aceptado).

### 3.3 Formulario (drawer "Nuevo Registro")

Campos, en orden:
1. **Operador** — `select`, opciones desde `GET /operadores` (reutilizar hook/fetch existente de Nueva Gestión).
2. **Número de abonado** — `input` de texto (requerido, 1..120).
3. **Canal** — `select`, opciones desde `catalogos.canales` (10).
4. **Motivo** — `select`, opciones desde `catalogos.motivos`.
5. **Solución aplicada** — `select`, opciones desde `catalogos.soluciones`.
6. **Estado** — control segmentado o `select` (`Solucionado` / `En proceso` / `Escalado`).

Comportamiento: validación cliente (requeridos), botón Guardar deshabilitado hasta completar; al
guardar dispara `useCrearAtencion` (POST), cierra el drawer, invalida la query y la tabla/KPIs/paneles
se refrescan. Overlay + cierre por backdrop/botón × / Cancelar. Manejo de error de la mutación
(mensaje inline, no romper). Accesibilidad básica: rol dialog, focus al abrir, cerrar con Esc.

### 3.4 Data-fetching

- `fetchFibexPlayGestion()` → `api.get('/fibex-play/gestion')`, degrada a estado vacío ante error/404
  (KPIs 0, arrays vacíos, catálogos vacíos) — patrón `fetchAnalisisMensual`.
- `crearAtencion(payload)` → `api.post('/fibex-play/gestion', payload)`.
- `useCrearAtencion`: `useMutation` con `onSuccess` → `queryClient.invalidateQueries(['fibex-play-gestion'])`.

### 3.5 Tests (TDD, primero el que falla)

- `routes.test.tsx`: `/fibex-play/gestion` monta la página (protegida → login sin sesión).
- `FibexPlayToggle.test.tsx`: dos enlaces a `/fibex-play` y `/fibex-play/gestion`; marca activo el correcto.
- `AppTopBar.test.tsx`: "Fibex Play" activo también en `/fibex-play/gestion`.
- `FibexPlayGestionPage.test.tsx` (React Query mock): renderiza 3 KPI con valores, Top Canales,
  Origen del Problema y la tabla de la bitácora; estado vacío cuando no hay registros.
- `NuevoRegistroDrawer.test.tsx`: abre con el botón, rellena el form con catálogos mock, submit llama
  a la mutación con el payload correcto y cierra; botón Guardar deshabilitado si faltan requeridos.

---

## 4. Criterios de aceptación

1. `GET /fibex-play/gestion` responde `200` con el DTO especificado (con token) y `401` sin token;
   `POST` responde `201` con body válido, `400` con inválido, `401` sin token. Ambos en Swagger.
2. KPIs correctas por estado; `topCanales` desc top-5; `origen` derivado del motivo, orden del catálogo,
   solo categorías con total>0; `registros` desc por `creadoEn`. Caso vacío → 0 y arrays vacíos.
3. El seed crea ~24 atenciones idempotentes ligadas a operadores existentes.
4. La ruta `/fibex-play/gestion` renderiza header + toggle + 3 KPI + 2 paneles + bitácora, fiel al
   diseño, con dark/light por tokens.
5. El toggle navega correctamente entre Grilla en Vivo y Gestión de Clientes; "Fibex Play" queda
   activo en la nav en ambas.
6. El botón "Nuevo Registro" abre el drawer; el form (Operador select, Nº abonado, Canal select 10
   opciones, Motivo select, Solución select, Estado) crea un registro real vía POST, y al guardar la
   bitácora, KPIs y paneles se actualizan.
7. Colores por estado según la semántica (success/warning/danger); paneles con paleta categórica.
8. Todas las suites (Vitest front, Jest unit + e2e back) en verde. Lint limpio.

---

## 5. Fuera de alcance

- **Borrado** de registros (botón ✕ y modal de confirmación del diseño) y edición.
- Vista **mobile** de tarjetas de la bitácora (el diseño la trae; por ahora tabla con scroll-x). Opcional si es barato.
- Estados skeleton de carga con shimmer (el diseño los trae; usar el patrón de loading existente del proyecto).
- Filtros/búsqueda/paginación de la bitácora.
