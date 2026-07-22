# Spec — Registro · Nueva Gestión

- **Slug:** `registro-nueva-gestion`
- **Estado:** Aprobado (2026-07-22) · Hecho · **Revisión 2 aprobada (2026-07-22)** — ver §9
- **Dominio(s):** ambos (front + back)
- **Ticket(s) derivados:** back: `POST /gestiones` + extensión modelo · front: página `/registro`
- **Diseño fuente:** `Registro Nueva Gestion.dc.html` → componente `NuevaGestion.dc.html`
  (Claude Design · "Fibex Control Design System")

## 1. Objetivo

Dar a los operadores de la mesa una pantalla **Registro → Nueva Gestión** para persistir una
atención directamente en PostgreSQL. Al guardar, la gestión alimenta automáticamente los
dashboards existentes (Monitor Diario y Análisis Mensual), que leen de la misma tabla `Gestion`.
Es el **primer flujo de escritura** de la app.

## 2. Criterios de aceptación

- [ ] Ruta `/registro` protegida (sin token → redirige a `/login`); tab "Registro" activo en `AppTopBar`.
- [ ] Formulario en 3 grupos fiel al diseño: (1) Datos de la gestión, (2) Ubicación, (3) Clasificación y cierre.
- [ ] Campo **Operador** es de solo lectura y se autocompleta con `user.name` de la sesión (no editable).
- [ ] Campos obligatorios (`abonado, telefono, detalle, solucion, zona, motivo, observacion`) validan
      en cliente: al pulsar Guardar con alguno vacío, se muestra el mensaje de error bajo el campo y
      **no** se hace la petición.
- [ ] Con datos válidos, Guardar hace `POST /gestiones`, y al `201` muestra el **toast** "Gestión guardada"
      y limpia/resetea el formulario.
- [ ] Botón **Limpiar** resetea el formulario a su estado inicial (operador y fecha se conservan).
- [ ] Mapa **Leaflet** integrado al tema (dark/light) con marcador arrastrable; click en el mapa y
      arrastre del pin actualizan el campo de coordenadas. Botón **Capturar GPS** usa geolocalización
      del navegador y recentra el pin.
- [ ] Rail lateral "Estado del Sistema" (3 ítems estáticos) + tarjeta "Consejo".
- [ ] Back: `POST /gestiones` protegido con `JwtAuthGuard`, documentado en Swagger, valida el body,
      toma el `operadorId` de `req.user` (nunca del body), persiste y devuelve `201`.
- [ ] Una gestión creada aparece reflejada en `GET /dashboard/monitor-diario` y `…/analisis-mensual`
      del mismo día/mes (misma tabla `Gestion`).

## 3. Contratos (API / tipos)

Fuente de verdad compartida front ↔ back. El front envía **valores de enum**, no etiquetas.

```ts
// ── enum ya existente en el back (src/generated/prisma/enums.ts) ──
type ResultadoGestion =
  | 'SOLUCIONADO_MESA' | 'ENVIADO_SOPORTE2' | 'ESCALADO_NOC'
  | 'PENDIENTE_CLIENTE' | 'REAGENDADO';

// ── Request: POST /gestiones  (requiere JWT; rol: cualquier usuario autenticado) ──
interface CreateGestionRequest {
  fecha: string;              // 'YYYY-MM-DD'  (por defecto hoy)
  abonado: string;            // * requerido  (nombre/condominio del cliente)
  telefono: string;           // * requerido  (ej. '0412 555 1234')
  detalle: string;            // * requerido  (Detalle de Orden)
  solucion: string;           // * requerido  (Solución Aplicada)
  resultado: ResultadoGestion;//   por defecto 'SOLUCIONADO_MESA'
  tipo: string;               //   Tipo Resolución ('Mesa' | 'Soporte 2' | 'NOC' | 'Visita técnica')
  requiereVisita: boolean;    //   por defecto false
  zona: string;               // * requerido  (Zona del Reporte → se persiste en columna `ubicacion`)
  motivo: string;             // * requerido  (Motivo de la Incidencia)
  observacion: string;        // * requerido  (Observación del SAE)
  coordenadas?: string | null;//   opcional    (pin 'lat, lng', ej. '10.6012, -66.9311')
}

// ── Response 201 ──
interface GestionResponse {
  id: string;
  fecha: string;              // 'YYYY-MM-DD'
  operador: { id: string; nombre: string };
  abonado: string;
  telefono: string;
  detalle: string;
  solucion: string;
  resultado: ResultadoGestion;
  tipo: string;
  requiereVisita: boolean;
  zona: string;
  motivo: string;
  observacion: string;
  coordenadas: string | null;
  createdAt: string;          // ISO instante
}
```

### Opciones de los selects (del diseño)

| Campo      | Opciones |
|------------|----------|
| `detalle`  | Falla LOS · Internet Lento · Sin Internet · Caídas Seguidas · No Navega · Usuario Clave GNT |
| `solucion` | Reinicio de ONU · Cambio de potencia · Reconfiguración remota · Recableado interno · Reemplazo de equipo |
| `resultado`| Solucionado en Mesa `SOLUCIONADO_MESA` · Enviado a Soporte 2 `ENVIADO_SOPORTE2` · Escalado a NOC `ESCALADO_NOC` · Pendiente Cliente `PENDIENTE_CLIENTE` |
| `tipo`     | Mesa · Soporte 2 · NOC · Visita técnica |
| `zona`     | Caraballeda · Caribe · Catia La Mar · El Trébol · La Guaira · La Soublette · Macuto · Maiquetía · Pariata · Tanaguarena |
| `motivo`   | Corte de fibra · Falla eléctrica · Saturación de nodo · Mantenimiento programado · Afectación por clima |

### Modelo de datos (Prisma) — extensión de `Gestion`

Se **extiende** el modelo existente con migración nueva (sin tocar la existente). La columna
`ubicacion` sigue siendo la **zona** (así el HeatMap de Análisis Mensual no cambia); el pin exacto
va en `coordenadas`.

```prisma
model Gestion {
  id             String           @id @default(uuid())
  operador       User             @relation(fields: [operadorId], references: [id])
  operadorId     String
  resultado      ResultadoGestion
  motivo         String
  ubicacion      String                        // = zona del reporte (alimenta el heatmap)
  fecha          DateTime         @db.Date
  createdAt      DateTime         @default(now())
  // ── nuevos ──
  abonado        String
  telefono       String
  detalle        String
  solucion       String
  tipo           String
  requiereVisita Boolean          @default(false)
  observacion    String
  coordenadas    String?

  @@index([fecha])
  @@index([operadorId, fecha])
}
```

> **Compatibilidad con el seed / dashboards:** las filas existentes (seed histórico) no tienen los
> campos nuevos. La migración debe dar `@default` o valor de relleno a las columnas `NOT NULL`
> nuevas (p. ej. `''` para textos, `false` para `requiereVisita`) para no romper el seed ni exigir
> reseed. `backend-dev` decide entre `@default("")` en el schema o un `DEFAULT` en la migración SQL.

## 4. Casos borde y validaciones

- **Campo obligatorio vacío** → back responde `400` (ValidationPipe: `whitelist +
  forbidNonWhitelisted`); front valida antes y no llega a enviar. `resultado` fuera del enum → `400`.
- **No autenticado / token inválido** → `401` (el interceptor Axios ya hace `logout()` en 401).
- **`operadorId` nunca se acepta del body**: se toma de `req.user.id`. Si el body lo incluye, se ignora/rechaza.
- **`fecha`** se normaliza a medianoche UTC igual que los dashboards (`new Date('YYYY-MM-DDT00:00:00.000Z')`)
  para que las consultas por día/mes cuadren.
- **`coordenadas`** es opcional; formato libre `'lat, lng'` (no se valida geometría en este ticket).
- **Error de red / 500 al guardar** → el front muestra un mensaje de error (no toast de éxito) y
  mantiene los datos del formulario para reintentar.
- **GPS denegado por el navegador** → mensaje suave; el usuario puede seguir con el pin del mapa o input manual.

## 5. Fuera de alcance

- Edición/borrado de gestiones (solo alta) y listado/historial (es otra sección).
- Autocompletado de abonado desde un catálogo de clientes; validación estricta de teléfono venezolano.
- Geocoding inverso (coordenadas → dirección) y validación geométrica del pin.
- Permisos por rol distintos (cualquier usuario autenticado puede registrar).

## 6. Plan de tests (rojo primero)

- **Back (Jest + supertest, patrón `test/dashboard.e2e-spec.ts`, mock de `PrismaService`):**
  - `201` con body válido → llama `prisma.gestion.create` con `operadorId` = usuario del token.
  - `operadorId` del body es ignorado (usa el del token).
  - `400` si falta un campo obligatorio o `resultado` no es del enum.
  - `401` sin `Authorization`.
  - (unit) `GestionService.crear` normaliza `fecha` a UTC y mapea `zona → ubicacion`.
- **Front (Vitest + RTL, mock de `lib/api/gestiones`):**
  - Render de la página con los 3 grupos y el operador de sesión precargado.
  - Guardar con obligatorios vacíos → muestra errores y **no** llama a la API.
  - Guardar con datos válidos → llama `createGestion` con el payload correcto y muestra el toast.
  - Botón Limpiar resetea los campos.
  - (El mapa Leaflet se aísla/mockea en los tests de la página; su interacción no se testea en unit.)

## 7. Notas de homologación de stack

- **Leaflet** es dependencia nueva (aprobada 🚦): instalar `leaflet` + `react-leaflet` + `@types/leaflet`
  en `mesa-control-front`. Tiles CARTO `dark_all`/`light_all` según el tema, como el diseño.
- Es la **primera mutación** del front: se añade `createGestion()` (`api.post`) en
  `src/lib/api/gestiones.ts`, tipos en `src/lib/api/types.ts`, y hook `useCrearGestion` (`useMutation`,
  modelo `useLogin`). El QueryClient ya existe; invalidar las queries de dashboard tras crear.
- Back: nuevo `GestionModule` + `GestionController` + `GestionService`, registrado en `AppModule`;
  nueva migración Prisma. Reutiliza `JwtAuthGuard`, `ValidationPipe` global y el patrón `@ApiBearerAuth`.

## 8. Estructura de componentes (front, ordenada)

```
src/features/registro/
  NuevaGestionPage.tsx            # orquesta: AppTopBar + PageHeader + form + rail + toast
  components/
    GestionForm.tsx               # <form>, estado de valores/errores, submit
    GrupoDatos.tsx                # grupo 1 (fecha, operador, abonado, teléfono, selects, toggle visita)
    GrupoUbicacion.tsx            # grupo 2 (input pin + botón GPS + <MapaUbicacion/>)
    GrupoClasificacion.tsx        # grupo 3 (zona, motivo, observación) + footer de acciones
    MapaUbicacion.tsx             # wrapper Leaflet (tema-aware, marcador arrastrable, onChange coords)
    EstadoSistemaRail.tsx         # rail lateral + tarjeta Consejo
    GuardadoToast.tsx             # toast de confirmación
    campos/                       # inputs reutilizables con estado focus/error (Input, Select, Textarea, SegToggle)
  hooks/
    useCrearGestion.ts            # useMutation → createGestion, invalida dashboards
    useGestionForm.ts             # estado del formulario + validación (opcional, si simplifica)
```

---

## 9. Revisión 2 (aprobada 2026-07-22) — operador seleccionable + date picker

Tres cambios sobre la página `/registro` ya entregada.

### 9.1 Operador pasa a ser un **select** (cambia el contrato)

- **Antes:** el operador era de solo lectura (nombre de la sesión) y `operadorId` salía del token.
- **Ahora:** es un `<select>` de operadores; el elegido **determina la autoría** y su `id` viaja en el
  body como `operadorId`. Se **precarga** con el operador de la sesión (`user.id`).
- **Back — nuevo endpoint** para poblar el select:
  `GET /operadores` — protegido con `JwtAuthGuard`, documentado en Swagger. Devuelve los usuarios con
  rol `OPERADOR`, ordenados por nombre:
  ```ts
  interface OperadorOption { id: string; nombre: string }
  // 200 → OperadorOption[]
  ```
- **Back — `POST /gestiones`** ahora acepta `operadorId` en el body (deja de tomarse de `req.user`):
  ```ts
  interface CreateGestionRequest {
    operadorId: string;   // NUEVO · requerido · debe referenciar un usuario con rol OPERADOR
    // …resto igual que §3…
  }
  ```
  Validación: `@IsString()/@IsNotEmpty()` (o `@IsUUID()`); el service verifica que el usuario existe y
  tiene rol `OPERADOR` → si no, `400` (o `404`). El endpoint sigue requiriendo JWT (cualquier usuario
  autenticado puede registrar en nombre de un operador).
- **Response 201**: sin cambios (`operador: { id, nombre }` ya refleja el operador persistido).

### 9.2 Seed de operadores dummy

Añadir al seed varios usuarios con rol `OPERADOR` (nombres realistas de mesa, p. ej. *Cristhian Rangel,
Jhon Rivas, María Bastidas, Luis Colmenares, Andrea Pérez*) para poblar el select y los dashboards.
Idempotente (`upsert` por email), sin romper el seed histórico existente ni los usuarios ya sembrados.

### 9.3 Date picker

Sustituir el `<input type="date">` por un componente de calendario con **`react-day-picker`**
(dependencia nueva aprobada 🚦), estilizado con los tokens del tema (dark/light), accesible por teclado.
Emite `YYYY-MM-DD` al formulario (mismo valor que hoy); no cambia el contrato de la API. Encapsular en
`components/campos/DateField.tsx` (o `FechaField`) reutilizando el patrón de `campos/`.

### 9.4 Tests añadidos (rojo primero)

- **Back:** `GET /operadores` → 200 lista operadores (rol OPERADOR) / 401 sin token. `POST /gestiones`
  con `operadorId` inexistente o de no-operador → 400/404; con `operadorId` válido → persiste esa autoría.
  Seed: test/aserción de que crea los operadores dummy de forma idempotente.
- **Front:** el select de operador se puebla desde `GET /operadores` (mock) y precarga la sesión; el
  payload incluye el `operadorId` elegido; el `DateField` selecciona una fecha y emite `YYYY-MM-DD`.
