# Spec — Historial General: editar una gestión

**Slug:** `historial-editar-gestion`
**Alcance:** `mesa-control-back` (endpoints + migración) y `mesa-control-front` (modal de edición).

## Objetivo

Permitir editar una gestión ya registrada desde el Historial General. Hoy el botón "Editar
gestión" del drawer es un no-op (`GestionDrawer.tsx:98`) y **no existe endpoint de actualización**
en el backend. Además se elimina el botón "Ver abonado", que no tiene respaldo de datos.

## Estado actual (investigación)

- Back: solo `GET /gestiones` (`gestion.controller.ts:24`) y `POST /gestiones` (`:45`).
  No hay `PATCH`/`PUT` ni `GET /gestiones/:id` en todo el repo.
- `Gestion` no tiene `updatedAt` ni `updatedBy` (`schema.prisma:84-118`); no hay auditoría.
- `RolesGuard` + `@Roles()` existen y están probados (`auth/roles.guard.ts:18`,
  único consumidor `supervision.controller.ts:33-34`). Roles: `OPERADOR | SUPERVISOR | ADMIN`.
- Front: `useGestionForm` (`registro/hooks/useGestionForm.ts:92-124`) es estado local puro
  (sin API), casi reutilizable; `toPayload` (`:69-86`) es función pura exportada.
- `GestionRow` (`lib/api/types.ts:231-253`) **no basta** para precargar el formulario:
  faltan `tipo`, `motivo`, `observacion`, `requiereVisita`, `coordenadas`.

## Decisiones tomadas

- **Permisos**: solo `ADMIN` y `SUPERVISOR` editan.
- **UI**: modal sobre el historial (los filtros y la página de la tabla se conservan).
- **Auditoría**: `updatedAt` + `updatedBy`.

## Cambios

### Backend

1. **Migración Prisma** sobre `Gestion`: `updatedAt DateTime?` y `updatedBy String?` con relación
   opcional a `User`. **Ambos nullable a propósito** — las filas existentes y el seed histórico no
   se tocan, y `null` significa "nunca editada". No usar `@updatedAt` automático: debe reflejar
   solo ediciones explícitas, no cualquier escritura.
2. **`GET /gestiones/:id`** — `JwtAuthGuard`. Devuelve el detalle completo para precargar el
   formulario, reutilizando `GestionResponseDto`/`aResponse` (`gestion.service.ts:275`).
   `404` si el id no existe. Debe incluir `codigo` (`LG-#####`) y los campos que hoy faltan
   en la fila del listado.
3. **`PATCH /gestiones/:id`** — `JwtAuthGuard` + `RolesGuard` + `@Roles(ADMIN, SUPERVISOR)`.
   - Body: `UpdateGestionDto = PartialType(CreateGestionDto)`. Todos los campos opcionales,
     pero `@IsNotEmpty()` se conserva vía `PartialType`, así que un `""` explícito sigue
     dando `400` (deseable).
   - **`operadorId` SÍ es editable**: el formulario de registro incluye el campo Operador y el
     spec exige consistencia de campos; un supervisor debe poder corregir una asignación errónea.
     Se aplica la misma validación que el POST (400 si el usuario destino no tiene rol `OPERADOR`).
     La autoría queda trazada por `updatedBy`.
   - **Inmutables**: `id`, `createdAt` y, por tanto, el `codigo` (derivado del id) y la `hora`.
   - El service escribe `updatedAt = new Date()` y `updatedBy = request.user.id` (del token,
     **nunca** del body).
   - `404` si el id no existe. `403` si el rol no está autorizado.
4. **Respuesta**: `GestionResponseDto` gana `updatedAt` y `updatedBy` (nullables).

### Frontend

5. **Eliminar el botón "Ver abonado"** (`GestionDrawer.tsx:99-101`) y su assert
   (`GestionDrawer.test.tsx:84-88`).
6. **Parametrizar `useGestionForm(iniciales?)`** (`useGestionForm.ts:92-124`): valores iniciales
   inyectables y `reset()` que vuelve a esos iniciales, no al hardcode de creación.
   No debe romper el uso actual en el registro.
7. **Extraer los campos a un componente reutilizable** (`GestionCampos`) a partir de los tres
   `Grupo*` (`GrupoDatos.tsx:37-107`, `GrupoUbicacion.tsx:33-56`, `GrupoClasificacion.tsx:18-45`),
   que ya reciben solo `values/errors/setField` y tienen slot `acciones`.
   `GestionForm` pasa a envolverlo en modo creación, **sin cambios visibles en el registro**.
8. **Modal de edición** abierto desde "Editar gestión" del drawer:
   - Mismos campos, **mismo orden y mismos controles** que el registro:
     Fecha · Operador · Abonado · Nombre del Cliente · Teléfono · Detalle de la Orden ·
     Solución Aplicada · Resultado · Tipo de Resolución · Requiere Visita Técnica ·
     Coordenadas del Pin (+ mapa) · Zona del Reporte · Motivo de la Incidencia · Observación del SAE.
   - Título con el código (`Editar gestión LG-40921`). Footer: `Cancelar` / `Guardar cambios`.
   - Precarga vía `GET /gestiones/:id`; estado de carga y de error visibles.
   - Accesible: `role="dialog"`, foco atrapado, cierre con `Escape` y por backdrop.
9. **`useEditarGestion`** clonando `useCrearGestion` (`useCrearGestion.ts:20-30`).
   Invalida `['historial']` (prefijo) **además de** monitor y análisis — hoy nadie invalida
   el historial (`useHistorial.ts:6`), así que sin esto la tabla no refrescaría.
10. **Visibilidad por rol**: el botón "Editar gestión" solo se muestra a `ADMIN` y `SUPERVISOR`.
    Verificar de dónde lee el front el rol del usuario (store de auth) antes de implementar;
    si no está disponible, reportarlo en vez de inventar un mecanismo.

## Criterios de aceptación

1. Un `ADMIN` o `SUPERVISOR` abre el modal desde el drawer, ve **todos** los campos precargados
   con los valores actuales, en el mismo orden que el registro.
2. Guardar persiste los cambios y la fila del historial se actualiza sin recargar la página.
3. Cancelar / `Escape` cierra sin guardar y sin mutar la fila.
4. Un `OPERADOR` no ve el botón de editar, y `PATCH /gestiones/:id` le responde `403`.
5. `PATCH` a un id inexistente responde `404`.
6. Tras editar, `updatedAt` y `updatedBy` quedan poblados; una gestión nunca editada los tiene `null`.
7. El botón "Ver abonado" no existe en ninguna parte de la UI.
8. El registro (`/registro`) sigue funcionando exactamente igual tras la extracción de componentes.
9. Suites verdes: `npm test` + `npm run test:e2e` (back), `npm test` + `npm run lint` (front).

## Casos borde

- **Valores legados fuera de `opciones.ts`**: `detalle`/`solucion`/`zona`/`motivo` son texto libre
  en el back pero `SelectField` cerrado en el front. Si una gestión trae un valor que no está en
  las opciones, **no debe perderse silenciosamente** al abrir el modal: añadirlo como opción
  transitoria seleccionada. Este es el riesgo principal de corrupción de datos del ticket.
- `coordenadas` nulas: el mapa arranca sin pin, como en el registro.
- Edición concurrente: fuera de alcance, gana el último en guardar (sin control de versión).
- Filas con `nombreCliente`/`telefono` vacíos (históricas): el modal exige rellenarlos para poder
  guardar, coherente con la validación de obligatorios ya existente.

## Tests

- Back: e2e de `PATCH` (200 admin/supervisor, 403 operador, 404 id inexistente, 400 campo vacío,
  400 operadorId no-OPERADOR) y de `GET /gestiones/:id` (200 + 404); unit del service
  (escribe `updatedAt`/`updatedBy`, no toca `createdAt`). Plantillas: `test/gestion.e2e-spec.ts:85`,
  `test/supervision.e2e-spec.ts` (403), `gestion.service.spec.ts:52`, `auth/roles.guard.spec.ts:17`.
  Los e2e mockean `PrismaService`: añadir `gestion.update` y `gestion.findUnique` al mock.
- Front: modal (precarga, orden de campos, guardar, cancelar, `Escape`), `useEditarGestion`
  (invalidaciones), drawer sin "Ver abonado", visibilidad por rol, y no-regresión del registro.
  Plantillas: `useCrearGestion.test.tsx`, `NuevaGestionPage.test.tsx`, `GestionDrawer.test.tsx:84`.
