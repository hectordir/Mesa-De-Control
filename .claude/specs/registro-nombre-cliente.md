# Spec — Registro: campo "Abonado" + "Nombre del Cliente" y limpieza del panel derecho

**Slug:** `registro-nombre-cliente`
**Ámbito:** `mesa-control-front/src/features/registro`, `mesa-control-back` (Prisma + módulo gestiones)
**Estado:** pendiente de aprobación 🚦

---

## 1. Objetivo

En la página `/registro` (Nueva Gestión):

1. El campo hoy etiquetado **"Abonado / Cliente"** pasa a llamarse **"Abonado"** (identificador del
   abonado, sigue viajando como `abonado`).
2. Se añade un campo nuevo **"Nombre del Cliente"** (`nombreCliente`), persistido en base de datos.
3. Se elimina por completo el panel derecho (`EstadoSistemaRail`): "Estado del Sistema" y "Consejo".
   El formulario pasa a ocupar el ancho completo.

## 2. Estado actual (referencia)

- Página: `mesa-control-front/src/features/registro/NuevaGestionPage.tsx:24` — grid
  `lg:grid-cols-[1fr_320px]`; izquierda `GestionForm`, derecha `EstadoSistemaRail`.
- Rail: `.../components/EstadoSistemaRail.tsx` — panel "Estado del Sistema" (`:19-35`, datos
  estáticos) + panel "Consejo" (`:36-42`, texto hardcodeado).
- Campo actual: `.../components/GrupoDatos.tsx:53-59` → `label="Abonado / Cliente"`, `values.abonado`.
- Estado del form: `.../hooks/useGestionForm.ts` — interfaz `:5`, `abonado` `:9`, obligatorios `:25`,
  iniciales `:45`, `toPayload` `:64`.
- Contrato: `mesa-control-front/src/lib/api/types.ts:162` (`CreateGestionRequest`),
  POST `/gestiones` vía `src/lib/api/gestiones.ts:13`.
- Sin zod/yup: validación manual de "campo requerido" en `useGestionForm.ts:99-106`.

## 3. Backend

### 3.1 Modelo

Añadir al modelo `Gestion` de Prisma:

```prisma
nombreCliente String @default("")
```

- **Opcional en la API, no nulo en BD** (`@default("")`) para no romper filas existentes ni el seed.
- Migración nueva (no `db push` destructivo). Nombre sugerido: `add_nombre_cliente_gestion`.

### 3.2 DTO / Swagger

- `CreateGestionDto`: `nombreCliente?: string` — `@IsString()` `@IsOptional()`
  `@MaxLength(120)` `@ApiPropertyOptional({ description: 'Nombre del cliente' })`.
- La respuesta de gestión (`GestionResponse` / entity) incluye `nombreCliente`.
- `GET /gestiones` devuelve el campo (no se cambian filtros ni orden).

### 3.3 Seed

`prisma/seed.ts` debe poblar `nombreCliente` con un valor plausible por gestión.

### 3.4 Tests (TDD, primero rojo)

- Unit/e2e: `POST /gestiones` con `nombreCliente` lo persiste y lo devuelve.
- `POST /gestiones` **sin** `nombreCliente` sigue funcionando (queda `""`).
- `nombreCliente` de más de 120 chars → 400.

## 4. Frontend

### 4.1 Formulario

- `GrupoDatos.tsx`: renombrar la etiqueta del campo existente a **"Abonado"** (placeholder
  coherente, p. ej. identificador/nº de abonado). No cambia el nombre de la propiedad `abonado`.
- Añadir `TextField` **"Nombre del Cliente"** justo después de "Abonado", mismo estilo
  (`FieldShell`/`controlClass`), respetando la grilla de la sección.
- `useGestionForm.ts`:
  - interfaz `GestionFormValues`: `nombreCliente: string`
  - valores iniciales: `nombreCliente: ''`
  - `CAMPOS_OBLIGATORIOS`: **incluir** `nombreCliente` (obligatorio, igual que `abonado`)
  - `toPayload`: `nombreCliente: values.nombreCliente.trim()`
  - reset tras guardado exitoso limpia el campo nuevo.
- `src/lib/api/types.ts`: añadir `nombreCliente: string` a `CreateGestionRequest` y al tipo de
  respuesta de gestión.

### 4.2 Layout

- `NuevaGestionPage.tsx`: eliminar el grid de 2 columnas y el render de `EstadoSistemaRail`;
  el formulario ocupa el ancho completo del contenedor (se mantiene el `max-width` de página si existe).
- **Borrar** `components/EstadoSistemaRail.tsx` y cualquier export en barriles/tests que lo referencie.
- El toast `GuardadoToast` se mantiene.

### 4.3 Tests (TDD, primero rojo)

En `NuevaGestionPage.test.tsx` (o test del form):

- Existe un campo con label **"Abonado"** y ya **no** existe "Abonado / Cliente".
- Existe un campo con label **"Nombre del Cliente"**.
- Enviar el formulario incluye `nombreCliente` con el valor tecleado (trim) en el payload de la mutación.
- Enviar con "Nombre del Cliente" vacío marca error de campo requerido y **no** dispara la mutación.
- **No** se renderiza "Estado del Sistema" ni "Consejo" en la página.
- Actualizar/eliminar las aserciones existentes que dependan del rail.

## 5. Criterios de aceptación

1. `/registro` muestra el formulario a ancho completo, sin panel derecho.
2. El formulario tiene "Abonado" y "Nombre del Cliente" como campos separados y ambos obligatorios.
3. Guardar una gestión persiste `nombreCliente` y el dato vuelve en `GET /gestiones`.
4. `npm run lint` + `npm test` verdes en front y back; `npm run build` verde en front.
5. Sin dependencias nuevas.

## 6. Fuera de alcance

- Mostrar `nombreCliente` en Monitor Diario, Análisis Mensual, Historial General o el drawer de detalle.
- Búsqueda/filtrado por nombre de cliente.
- Cambios de diseño en el resto del formulario (ubicación, clasificación).
