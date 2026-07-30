# Spec — Horas en hora venezolana (America/Caracas)

**Slug:** `hora-venezolana`
**Alcance:** `mesa-control-back` (formateo de instantes) y `mesa-control-front` (si formatea instantes).

## Objetivo

Que las horas mostradas correspondan a **America/Caracas (UTC−4)** y no a UTC, como hoy.
Una gestión registrada a las 8:00 a. m. de Caracas debe leerse `08:00`, no `12:00`.

## Estado actual (investigación con evidencia)

- Todo el formateo de instantes usa **UTC explícito** (`getUTCHours`, `toISOString`). No existe
  helper compartido ni ninguna zona declarada.
- `Gestion.createdAt`/`updatedAt` son `timestamp without time zone`; Postgres corre en `UTC` y
  Prisma los interpreta como UTC. `Gestion.fecha` es `@db.Date` (sin hora).
- El proceso Node corre en `America/Caracas`, y algunos cálculos dependen de esa hora local
  **implícita** (`hoy()`, `mesActual()`), que se rompería con `TZ=UTC` en producción.
- **Riesgo cuantificado contra la BD real: nulo.** De 8769 gestiones, **0** tienen `createdAt`
  entre 00:00 y 04:00 UTC, y **0** cambian de día al convertir a Caracas. El seed siembra la
  jornada a partir de las 12:00 UTC = 08:00 Caracas, es decir ya asumía hora venezolana: al
  mostrarla en Caracas los datos demo quedan **mejor**, no peor.
- Las agregaciones por día/mes (Monitor Diario, Análisis Mensual, buckets de SLA, filtros
  `desde`/`hasta`) agrupan **siempre por la columna `fecha` (`@db.Date`)**, nunca por `createdAt`,
  así que son inmunes al cambio de zona.

## Cambios

### Backend

1. **Helper único** en `src/common/time/` con `ZONA = 'America/Caracas'` y `Intl.DateTimeFormat`
   con `timeZone` explícito: `formatHoraVE` (24h), `formatHora12VE`, `formatFechaVE` (`DD/MM/YYYY`),
   `hoyVE`, `mesActualVE`. **Usar `Intl` con la zona IANA, no restar 4 horas fijas**: Venezuela
   tuvo offset −04:30 entre 2007 y 2016 y una resta fija falsearía fechas históricas.
2. **Sustituir el formateo UTC de instantes** por el helper:
   - `gestion.service.ts:380` — `hora` (columna "Hora" del historial). **Principal offensor.**
   - `gestion.service.ts:60-71` — `fechaDDMMYYYY()` y `hora12h()`, usados por `modificadaFecha`
     y `modificadaHora` (`:386-387`).
   - `fibex-play.service.ts:104-105` — `hh:mm` con `getUTCHours/getUTCMinutes`.
3. **Endurecer los cálculos de "hoy"/"mes actual"** para que usen la zona explícita en vez de la
   hora local implícita del proceso: `dashboard.service.ts:78,228`, `supervision.service.ts:89`,
   `seed/dia.ts:7`. Hoy funcionan por casualidad porque Node corre en Caracas.

### NO tocar (esto es lo más importante del ticket)

4. **El formateo de la columna `fecha` (`@db.Date`)**: `gestion.service.ts:379,396`,
   `dashboard.service.ts:387,412,240`, `supervision.service.ts:300`. Prisma la devuelve como
   medianoche UTC; convertirla a Caracas la **retrasaría un día entero**. Es el error más
   probable de esta implementación y debe quedar cubierto por un test.
5. **Los filtros y agregaciones** `gte`/`lt`/`where fecha`: ya operan sobre fecha sin hora.
6. **Los campos ISO crudos** (`gestion.service.ts:410-411`, `dashboard.service.ts:221`,
   `fibex-play.service.ts:98`, `gestion-app.service.ts:167`): se quedan como **ISO UTC (`Z`)**.
   Cambiarlos a offset `-04:00` arriesga romper el parseo en el front sin beneficio.

### Frontend

7. **Auditar si el front formatea instantes** (`createdAt`/`updatedAt`/`creadoEn`/`detectadoEn`
   recibidos como ISO crudo). Si los formatea con la hora local del navegador, un usuario fuera de
   Venezuela vería horas distintas a las del backend. Deben formatearse explícitamente en
   `America/Caracas`, con el mismo criterio.
8. Los campos **ya preformateados** por el back (`hora`, `modificadaFecha`, `modificadaHora`)
   se muestran tal cual: el front no debe reinterpretarlos.

## Criterios de aceptación

1. Una gestión con `createdAt` a las 12:00 UTC muestra `08:00` en la columna "Hora".
2. `modificadaHora` de un `updatedAt` a las 14:42 UTC muestra `10:42 a. m.`.
3. La `fecha` de la gestión **no se desplaza**: una gestión con `fecha = 2026-07-28` sigue
   mostrándose como `28/07/2026`, nunca `27/07/2026`.
4. Monitor Diario, Análisis Mensual y los buckets de SLA devuelven **exactamente los mismos
   conteos** que antes del cambio.
5. Las horas mostradas son las mismas se ejecute el proceso con `TZ=UTC` o `TZ=America/Caracas`.
6. Suites verdes: `npm test` + `npm run test:e2e` (back), `npm test` + `npm run lint` (front).

## Casos borde

- **Franja 00:00–04:00 UTC**: pertenece al día anterior en Caracas. Hoy no hay datos ahí (0 filas),
  pero una gestión creada de madrugada UTC debe mostrar el día correcto. Cubrir con test, no
  confiar en que los datos actuales lo eviten.
- **Proceso con `TZ` distinta**: los tests deben pasar con `TZ=UTC` para demostrar que no queda
  dependencia de la zona del host.
- **Offset histórico −04:30** (2007–2016): usar `Intl` con la zona IANA lo maneja; una resta fija no.

## Tests

- Back: unit del helper (incluida la franja 00:00–04:00 y una fecha anterior a 2016);
  `gestion-list.service.spec.ts:214` pasa de `'14:42'` a `'10:42'`;
  `fibex-play.service.spec.ts:157` de `'10:51'` a `'06:51'`;
  **test de no-regresión de `fecha`**: una gestión con `fecha` a medianoche UTC sigue emitiendo
  el mismo día; test de conteos idénticos en dashboard/supervisión.
  Ejecutar además la suite con `TZ=UTC`.
- Front: los que resulten de la auditoría del punto 7.
