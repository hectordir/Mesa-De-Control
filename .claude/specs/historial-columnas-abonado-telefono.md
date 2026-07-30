# Spec — Historial General: columnas Abonado/Cliente y teléfonos

**Slug:** `historial-columnas-abonado-telefono`
**Alcance:** `mesa-control-back` (código + seed) y `mesa-control-front` (tabla Historial).

## Objetivo

Corregir la semántica de las dos primeras columnas de datos de la tabla de Historial General y
hacer que la columna Teléfono deje de aparecer vacía.

## Estado actual (investigación)

- `codigo` es un string derivado del id (`FNV-1a`) con prefijo `GST-`, no existe en BD
  (`mesa-control-back/src/gestion/gestion.service.ts:31,252`).
- `Gestion.abonado` (`prisma/schema.prisma:99`) es texto libre con una **ubicación**
  (`"Cond. Los Robles"`, `"Norte · Casa 03"`), no un número de abonado.
- `Gestion.nombreCliente` (`schema.prisma:101`) existe, se siembra y **sí llega por la API**
  (`dto/gestiones-list-response.dto.ts:42`), pero el front no lo declara ni lo pinta.
- `Gestion.telefono` (`schema.prisma:102`) tiene `@default("")` y **ningún seed lo rellena** →
  la celda llega como `""`. El `select` y el DTO sí lo incluyen.

## Cambios

### Backend

1. **Prefijo del código**: `GST-` → `LG-` en la derivación del código
   (`gestion.service.ts:31`). Aplica a todas las respuestas que expongan `codigo`
   (listado y `GestionResponseDto`). Sin migración: el formato sigue siendo `LG-#####`.
2. **Sembrar teléfonos**: helper determinista `telefonoPorIndice(i)` en
   `src/seed/gestiones-demo.ts`, junto a `nombreClientePorIndice` (`:93`), con formato
   venezolano `04XX-XXX-XXXX` (prefijos `0412/0414/0416/0424/0426`).
   Usarlo en `gestiones-demo.ts:208`, `gestiones-mensuales.ts:294`, `enero-demo.ts:435`,
   `supervision-demo.ts:100`.
3. **Backfill idempotente** en `prisma/seed.ts`: rellenar `telefono` solo en filas con `''`,
   siguiendo el patrón ya existente para `nombreCliente` (`prisma/seed.ts:138-157`).
4. **Búsqueda**: añadir `nombreCliente` al `OR` del filtro `search`
   (`gestion.service.ts:196-203`), que hoy solo cubre `abonado`, `telefono` y `operador.name`.
5. **Ordenamiento por nombre de cliente**: añadir `nombreCliente` a las claves de orden
   aceptadas por el listado (`gestion.service.ts:224`), mapeada a `orderBy: { nombreCliente: dir }`.
   La clave `abonado` se mantiene en el contrato por compatibilidad aunque la tabla ya no la use.
   Clave inválida → sigue el comportamiento actual (fallback al orden por defecto, sin 500).
6. **Campos obligatorios en el POST** (`dto/create-gestion.dto.ts:60-68`): `nombreCliente` pasa de
   opcional a **requerido** (`@IsString() @IsNotEmpty() @MaxLength(120)`), igual que `telefono`,
   que ya lo es. Ambos dejan de aceptar string vacío: añadir `@IsNotEmpty()` a `telefono`.
   Se documenta como requerido en Swagger (`@ApiProperty`, sin `required: false`).

**Sin cambios de schema ni migraciones.** Los `@default("")` de `schema.prisma:101-102` se
conservan (protegen las filas históricas); la obligatoriedad se aplica en la capa de validación,
no en la BD. El contrato de la API no cambia de forma (mismos campos); cambian el prefijo del
valor `codigo`, la validación del POST y las claves de orden aceptadas.

### Frontend

7. `GestionRow` (`src/lib/api/types.ts:229`): añadir `nombreCliente: string`.
   `HistorialSortKey` (`types.ts:229-278`): añadir `'nombreCliente'`.
8. Tabla (`components/HistorialTable.tsx:24`):
   - Columna 1: header `Código` → **`Abonado`**, valor `row.codigo` (ahora `LG-#####`). Sigue sin ordenar.
   - Columna 3: header `Abonado` → **`Cliente`**, valor `row.nombreCliente`,
     con **`sortKey: 'nombreCliente'`** (ordena por nombre real, server-side).
   - La ubicación (`row.abonado`) **sale de la tabla**.
9. Cards móviles (`components/HistorialCards.tsx:23,28`): mismo cambio de dato
   (`codigo` + `nombreCliente`).
10. Drawer (`components/GestionDrawer.tsx:59,62,77-89`): el título pasa a ser `nombreCliente`;
    la ubicación (`abonado`) **se conserva** como campo de detalle etiquetado `Ubicación`.
11. CSV (`lib/historial.presentation.ts:51,65`): cabecera y filas alineadas con las columnas nuevas
    (`Abonado`, `Operador`, `Cliente`, `Teléfono`, `Zona`, …).
12. **Formulario de registro**: si el formulario que hace el POST no envía `nombreCliente` o lo
    permite vacío, marcarlo como campo requerido en la validación del front (mismo tratamiento
    que `telefono`), para que la nueva validación del back no produzca un 400 sorpresa.
    Verificar antes de tocar: puede que ya sea requerido.

## Criterios de aceptación

1. La primera columna se titula **Abonado** y muestra `LG-#####`.
2. La tercera columna se titula **Cliente** y muestra el nombre del cliente, no la ubicación.
3. La columna **Teléfono** muestra un número con formato `04XX-XXX-XXXX` para todas las
   gestiones sembradas; ninguna celda queda vacía tras correr el seed.
4. El drawer sigue mostrando la ubicación, ahora bajo la etiqueta `Ubicación`.
5. La exportación CSV refleja las columnas nuevas.
6. Buscar por nombre de cliente devuelve resultados.
7. Clicar la cabecera **Cliente** ordena por nombre de cliente asc/desc, y el back responde
   ordenado por `nombreCliente` (no por `abonado`).
8. `POST /gestiones` responde **400** si falta `nombreCliente` o si `nombreCliente`/`telefono`
   llegan como string vacío.
9. Suites verdes: `npm test` y `npm run test:e2e` (back), `npm test` (front).

## Casos borde

- **Filas históricas** creadas antes de este cambio pueden tener `nombreCliente`/`telefono` en `''`
  (la obligatoriedad es solo de validación en el POST, no de BD). La celda muestra `—`,
  no un string vacío. El backfill del seed cubre las filas demo.
- El backfill debe ser **idempotente**: correr el seed dos veces no reasigna teléfonos ya puestos.
- Ordenar por `nombreCliente` con filas de nombre vacío: quedan agrupadas al inicio o final según
  la dirección; no requiere tratamiento especial.

## Tests a actualizar

- Back: `gestion-list.service.spec.ts:148,166`, `test/historial.e2e-spec.ts:51,121`,
  `gestion.service.spec.ts`, `test/gestion.e2e-spec.ts` (prefijo `LG-`), specs de seed
  (`gestiones-demo.spec.ts:141`, `gestiones-mensuales.spec.ts:285`, `enero-demo.spec.ts:236`,
  `supervision-demo.spec.ts:59`).
- Front: `HistorialTable.test.tsx:8-30,57,81`, `GestionDrawer.test.tsx:9-12,63`,
  `historial.presentation.test.ts:61-71`, `HistorialPage.test.tsx:20-36`.
