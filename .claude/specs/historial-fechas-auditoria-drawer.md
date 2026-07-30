# Spec — Drawer del historial: fecha de creación y de modificación

**Slug:** `historial-fechas-auditoria-drawer`
**Alcance:** `mesa-control-back` (listado) y `mesa-control-front` (drawer de detalle).

## Objetivo

Mostrar en el drawer de detalle del Historial General **cuándo se creó** y **cuándo se modificó**
por última vez una gestión, ambas con hora, y **quién** la modificó.

## Estado actual

- `updatedAt`/`updatedBy` se guardan desde el ticket `historial-editar-gestion`
  (`schema.prisma:113-118`, relación `editor User? @relation("GestionEditor")`), pero
  **no se muestran en ninguna pantalla**.
- `GestionListItemDto` (`dto/gestiones-list-response.dto.ts`) **no expone** `updatedAt` ni
  `updatedBy`; el `select` de `listar()` (`gestion.service.ts:155-169`) tampoco los trae.
  El drawer se alimenta de la fila del listado, así que hoy no tiene el dato.
- `updatedBy` es un id de usuario: mostrar el nombre exige resolver la relación.
- El listado ya devuelve `fecha` (`YYYY-MM-DD`) y `hora` (`HH:mm` derivada de `createdAt`),
  ambas **formateadas en el backend** (`gestion.service.ts:249-269`).

## Decisiones tomadas

- **"Creada"**: **solo la fecha**, la del formulario (`fecha`, la que elige el operador).
  **Sin hora**, precisamente porque la hora disponible viene de `createdAt` y mezclarla con una
  fecha elegida por el operador produce lecturas engañosas.
- **"Modificada"**: fecha **y hora** de `updatedAt`, en formato **12 horas** (am/pm), no 24h.
- Se muestra **quién** hizo la última modificación, con su nombre.

## Cambios

### Backend

1. `select` de `listar()` (`gestion.service.ts:155-169`): añadir `updatedAt` y la relación
   `editor: { select: { id: true, name: true } }`.
2. `aItem()` (`gestion.service.ts:249`): emitir
   - `modificadaFecha: 'DD/MM/YYYY' | null` y `modificadaHora: 'hh:mm a. m./p. m.' | null`
     (**formato 12 horas**), derivadas de `updatedAt` y **formateadas en el backend**, con la
     misma lógica de zona horaria que la `hora` ya existente (`:268`) — solo cambia la
     representación a 12h, no el instante que representa.
   - `editor: { id, nombre } | null`.
   Los tres son `null` cuando la gestión nunca se editó.
   La `hora` existente (24h, usada por la columna "Hora" de la tabla) **no se toca**.
3. `GestionListItemDto`: declarar los campos nuevos con Swagger, nullables.

**Sin migración**: los datos ya existen en BD.

### Frontend

4. `GestionRow` (`lib/api/types.ts`): añadir `modificadaFecha`, `modificadaHora` y
   `editor: { id: string; nombre: string } | null`, todos nullables.
5. `GestionDrawer.tsx`: dos campos de auditoría en el detalle:
   - **Creada** — `{fecha}`, solo la fecha. **No mostrar hora de creación**, ni la de `hora`.
   - **Modificada** — `{modificadaFecha} {modificadaHora} · {editor.nombre}`, con la hora en 12h.
     Si la gestión nunca se editó, mostrar **"Sin modificaciones"**, no `—` ni una fila vacía:
     el estado "nunca editada" es información, no un dato faltante.
6. La fila hoy etiquetada solo con la fecha pasa a distinguirse claramente de la de modificación
   (etiquetas explícitas "Creada" / "Modificada").

## Criterios de aceptación

1. El drawer de una gestión **nunca editada** muestra su fecha de creación (sin hora) y
   "Sin modificaciones".
2. Tras editar una gestión desde el modal y reabrir el drawer, aparece la fecha, la hora en
   **formato 12h** y el **nombre** de quien la editó.
3. La hora de modificación es la real del sello `updatedAt`, no la de creación.
4. En ninguna parte del drawer se muestra una hora de creación.
5. La tabla del historial **no cambia** (su columna "Hora" sigue en 24h).
5. Suites verdes: `npm test` + `npm run test:e2e` (back), `npm test` + `npm run lint` (front).

## Casos borde

- **Editor eliminado**: la FK es `ON DELETE SET NULL`, así que puede haber `updatedAt` con
  `editor: null`. Mostrar la fecha sin nombre, nunca "null" ni un fallo de render.
- Gestiones demo del seed: todas tienen `updatedAt` nulo → "Sin modificaciones".
- Zona horaria: `modificadaHora` debe coincidir con el criterio de `hora`; si difieren, una
  gestión editada podría parecer modificada antes de crearse.

## Tests

- Back: unit de `aItem()` (emite los campos con `updatedAt` presente; `null` cuando no lo está;
  `editor: null` con editor borrado) y del `select` (`gestion-list.service.spec.ts:166`);
  e2e del listado afirmando los campos nuevos (`test/historial.e2e-spec.ts:121`).
- Front: `GestionDrawer.test.tsx` — gestión sin editar muestra "Sin modificaciones"; gestión
  editada muestra fecha, hora y nombre; caso `editor: null` con `updatedAt` presente.
