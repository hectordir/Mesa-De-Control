# Spec — Abonado Fibex, datos demo completos y observación opcional

**Slug:** `abonado-fibex-y-datos-demo`
**Alcance:** `mesa-control-back` (seed + validación) y `mesa-control-front` (etiquetas, opciones, obligatorios).

## Objetivo

Corregir la semántica del campo `abonado`, que es el **identificador externo del cliente en
Fibex** (editable, se envía al registrar), no una zona ni el id de BD. Además: poblar los campos
que el seed dejó vacíos —causa de que los selects salgan en blanco al editar—, arreglar un bug
de pérdida de datos en el select de Resultado, y hacer `observacion` opcional.

## Estado actual (diagnóstico con evidencia)

- **Los selects en blanco NO son un bug del modal.** El seed nunca escribe `detalle`, `solucion`,
  `tipo` ni `observacion`; el schema los declara `@default("")` (`schema.prisma:105-109`).
  Consulta a la BD real: **8769 de 8769 filas** con esos cuatro campos en `''`. El select recibe
  `value=''` y cae al placeholder. Descartadas con evidencia la carrera de carga (probado con GET
  a 50 ms), el mapeo de `aValoresFormulario` y un fallo de `conValorActual`.
- **Bug real de corrupción**: `RESULTADO_OPCIONES` (`front/src/features/registro/opciones.ts:9-14`)
  **omite `REAGENDADO`**, que sí está en el enum del back y en `types.ts:30`. Hay **548 gestiones**
  en ese estado; el select les muestra "Solucionado en Mesa" (índice 0). Si el usuario edita
  cualquier otro campo y guarda, **se sobrescribe el resultado real sin aviso**.
- `abonado` contiene zonas (`"Cond. Los Robles"`) por culpa del seed, pese a que `zona` ya es un
  campo propio (`ubicacion` en BD).
- El drawer etiqueta `abonado` como **"Ubicación"** (`GestionDrawer.tsx:83`), etiqueta introducida
  en el ticket anterior bajo la premisa equivocada. Debe volver a ser "Abonado".

## Decisiones tomadas

- **Formato del abonado: libre** por ahora. Tiene estructura en Fibex, pero no se conoce; no se
  impone validación de formato más allá de obligatorio y no vacío.
- **Tabla del historial: sin cambios.** Columna 1 sigue mostrando `LG-xxxx`; el abonado Fibex se
  ve en el drawer y en el modal de edición.
- **Seed: se regeneran** `abonado`, `detalle`, `solucion`, `tipo` y `observacion`.

## Cambios

### Backend

1. **`observacion` pasa a opcional** en `CreateGestionDto` (`create-gestion.dto.ts:115`):
   `@IsOptional()`, sin `@IsNotEmpty()`, con `@ApiProperty({ required: false })`.
   `UpdateGestionDto` lo hereda vía `PartialType`. El default `""` de Prisma se conserva.
2. **Seed — `abonado`**: helper determinista `abonadoPorIndice(i)` que genere identificadores
   **plausibles de Fibex** (numéricos de 7 dígitos, únicos, sin aleatoriedad), junto a
   `nombreClientePorIndice` y `telefonoPorIndice` (`src/seed/gestiones-demo.ts:93-118`).
   Aplicar en los 4 builders (`gestiones-demo.ts`, `gestiones-mensuales.ts`, `enero-demo.ts`,
   `supervision-demo.ts`). **Deja de escribirse la zona en `abonado`**; `zona`/`ubicacion` no se toca.
3. **Seed — campos vacíos**: poblar `detalle`, `solucion` y `tipo` con valores tomados de
   **catálogos idénticos a los del front** (`front/src/features/registro/opciones.ts`:
   `DETALLE_OPCIONES`, `SOLUCION_OPCIONES`, `TIPO_OPCIONES`) para que los selects los reconozcan.
   `observacion` con un texto plausible y variado. Distribución determinista por índice.
4. **Backfill de filas existentes** en `prisma/seed.ts`, siguiendo el patrón ya establecido de
   `backfillTelefono` (`prisma/seed.ts:165-191`): idempotente, solo filas con el campo en `''`.
   **Excepción `abonado`**: no está vacío, contiene zonas. Debe reasignarse el identificador Fibex
   a las filas demo (ids `seed-%`, `sup-%`, `mensual-%`, `enero-%`) de forma determinista y
   convergente — correr el seed dos veces no debe producir valores distintos.
   **No tocar filas ajenas al seed** (gestiones creadas por el POST).

### Frontend

5. **Bug de Resultado**: añadir `{ label: 'Reagendado', value: 'REAGENDADO' }` a
   `RESULTADO_OPCIONES` (`opciones.ts:9-14`) y envolver ese select con `conValorActual`,
   igual que los demás, por si aparece otro valor fuera de catálogo.
   **Ningún select de valor persistido debe quedar sin esa protección.**
6. **Placeholder** en el select de Tipo de Resolución (`GrupoDatos.tsx:96-101`): con `tipo=''`
   el navegador muestra hoy "Mesa" como valor fantasma sin que el estado lo contenga.
7. **`observacion` deja de ser obligatoria**: quitarla de `CAMPOS_OBLIGATORIOS`
   (`useGestionForm.ts:28-37`). Los demás obligatorios se mantienen.
8. **Etiqueta del drawer**: `GestionDrawer.tsx:83` vuelve de "Ubicación" a **"Abonado"**.
   El campo del formulario (registro y modal) sigue etiquetado "Abonado", editable, texto libre.
9. **CSV**: incluir el `abonado` en la exportación (`lib/historial.presentation.ts:59-72`),
   ahora que es un identificador útil y no una zona duplicada.
10. **Fixtures de test realistas**: `EditarGestionModal.test.tsx:30-50` usa hoy un fixture
    irrealmente completo, razón por la que ninguno de estos defectos salió en las suites.
    Añadir casos con campos vacíos y con `resultado: 'REAGENDADO'`.

## Criterios de aceptación

1. Al abrir el modal de edición de una gestión sembrada, **los seis selects muestran su valor
   actual**, ninguno en blanco.
2. Una gestión con `resultado: 'REAGENDADO'` muestra "Reagendado" en el select, y guardar sin
   tocar ese campo **no altera el resultado**.
3. `observacion` vacía permite guardar, tanto al crear como al editar; el back no devuelve 400.
4. El campo Abonado muestra el identificador Fibex y es editable; el drawer lo etiqueta "Abonado".
5. Tras correr el seed, ninguna gestión demo tiene `abonado` con forma de zona ni
   `detalle`/`solucion`/`tipo` vacíos.
6. La tabla del historial **no cambia**: primera columna sigue siendo `LG-xxxx`.
7. El seed sigue siendo idempotente: dos pasadas seguidas no cambian ningún valor.
8. Suites verdes: `npm test` + `npm run test:e2e` (back), `npm test` + `npm run lint` (front).

## Casos borde

- **Filas demo de días anteriores** (1536 identificadas en el ticket previo, ids con fecha que los
  builders de hoy no regeneran): el backfill debe alcanzarlas por patrón de id, no solo por
  "generado en esta corrida". Si no es viable, **reportarlo explícitamente** con el conteo.
- Gestiones creadas por el POST (no demo): no se tocan, aunque tengan campos vacíos.
- Valores de `detalle`/`solucion`/`tipo` que ya existieran fuera de catálogo: `conValorActual`
  los conserva; el backfill no debe sobrescribir campos que no estén vacíos.

## Tests

- Back: unit de `abonadoPorIndice` (determinismo, unicidad, formato de 7 dígitos) y de los
  generadores de `detalle`/`solucion`/`tipo`/`observacion` (valores dentro del catálogo del front);
  e2e de `POST`/`PATCH` sin `observacion` → 201/200, no 400. Plantillas: `gestiones-demo.spec.ts:159`,
  `test/gestion.e2e-spec.ts`, `test/gestion-editar.e2e-spec.ts`.
- Front: `opciones.test.ts` (REAGENDADO presente), `EditarGestionModal.test.tsx` con fixture de
  campos vacíos y con REAGENDADO (**el test de REAGENDADO debe escribirse primero, en rojo, y
  demostrar la sobrescritura silenciosa antes del fix**), `useGestionForm.test.ts` (observación
  no bloquea el submit), `GestionDrawer.test.tsx` (etiqueta "Abonado"),
  `historial.presentation.test.ts` (abonado en el CSV).
