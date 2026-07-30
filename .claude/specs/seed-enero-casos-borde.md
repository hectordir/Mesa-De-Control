# Spec — Seed de enero 2026 (banco de casos de prueba)

**Alcance:** sólo `mesa-control-back` (seed). No cambia API ni esquema salvo que falte algo, en
cuyo caso se reporta antes de tocarlo.

## Objetivo

Hoy los datos de prueba se concentran en fechas recientes y son homogéneos: casi todos los días
tienen volumen alto y forma parecida, así que la UI sólo se ejercita en su caso feliz. Al probar
el 25 de julio (2 gestiones) aparecieron defectos visuales que nadie había visto.

Se quiere **enero de 2026 como banco de pruebas**: pocos datos en total, pero deliberadamente
repartidos para cubrir la mayor variedad de casos posible. **No es volumen, es variedad.**
Si un caso no cabe en enero sin forzarlo, se continúa en **febrero de 2026**.

## Principios

1. **Determinista.** Sin `Math.random()` ni `new Date()` implícito: mismas entradas, mismas
   filas, como ya hacen `src/seed/dia.ts` y `canales.ts`.
2. **Idempotente.** Re-ejecutar el seed no duplica ni rompe lo ya sembrado (patrón `upsert` /
   `createMany` con `skipDuplicates` ya usado en el proyecto).
3. **No pisar lo existente.** Los seeds actuales (día de hoy, meses recientes, supervisión,
   canales) siguen funcionando igual. Enero/febrero se **añaden**.
4. **Volumen bajo.** Suficiente para ejercitar cada caso, no más.

## Casos a cubrir

### Por volumen del día
- Un día **sin ninguna gestión** (estado vacío del Monitor Diario, "Aún no hay gestiones hoy").
- Un día con **1 sola gestión**.
- Un día con **2-3 gestiones** (reproduce el defecto visual detectado el 25 jul).
- Un día con **volumen alto** que fuerce scroll en "Resumen por operador" y en el "Radar de
  Operaciones".

### Por operadores
- Un día atendido por **un solo operador**.
- Un día con **muchos operadores** (≥8, para ejercitar el scroll de la tabla). Aprovechar los
  operadores dummy existentes (`src/seed/operadores-dummy.ts:11-17`), que hoy no tienen gestiones.
- Un día donde un operador tenga **efectividad muy alta** y otro **muy baja**.

### Por resultado / métricas
- Un día con **los cinco resultados presentes** (Solucionado en Mesa, Enviado a Soporte 2,
  Escalado a NOC, Pendiente Cliente, Reagendado).
- Un día con **un único resultado** (dona al 100%: caso degenerado de la gráfica).
- Un día **por encima** de la meta de efectividad (75%) y otro **por debajo**.
- Un día que **supere** el umbral de Escalados a NOC (meta ≤ 25) y otro que lo cumpla.
- Un día que **supere** Pendiente Cliente (meta ≤ 40).

### Por averías / zonas
- Un día con **menos de 5 motivos distintos** (el panel "Top 5 Averías" con lista corta).
- Un día con **más de 5 motivos**, para que el top recorte.
- Variedad de **zonas** a lo largo del mes, para que el HeatMap mensual y el mapa no salgan planos.

### Por calendario
- Cubrir **primer y último día del mes** (1 y 31 de enero).
- Incluir **fines de semana** con actividad baja o nula.
- El **mes completo** debe dar una serie mensual creíble en Análisis Mensual (tendencia con
  variación real, no una línea plana).

## Criterios de aceptación

1. Existe un módulo de seed propio para este banco de datos (p. ej. `src/seed/enero-demo.ts`),
   con su spec de Jest, siguiendo el estilo de `supervision-demo.ts` / `canales.ts`.
2. Se integra en `prisma/seed.ts` sin romper el orden ni la idempotencia del seed actual.
3. Tests unitarios que verifiquen la **forma** de los datos generados: que cada caso de la lista
   anterior existe (día vacío, día de 1 gestión, día con los 5 resultados, día de un solo
   resultado, día con ≥8 operadores, etc.). El test es la prueba de que la variedad se cumple.
4. El seed corre de punta a punta sin error y es idempotente (ejecutarlo dos veces no duplica).
5. En el resumen debe indicarse **qué día de enero cubre qué caso**, en forma de tabla, para que
   se pueda navegar la UI y verificar cada uno.
6. Si algún caso no se pudo representar con el esquema actual, se dice explícitamente en vez de
   inventar un apaño.

## Restricciones

- No modificar el esquema Prisma ni los endpoints. Si algo lo requiere, **parar y reportarlo**.
- No tocar `mesa-control-front`.
- TDD: test que falla primero.
