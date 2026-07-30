# Spec — Fecha sincronizada entre Monitor Diario y Análisis Mensual

**Alcance:** sólo `mesa-control-front`. El backend **no se toca**. Sin dependencias nuevas
(Zustand ya está en el stack y en uso — ver `stores/auth.store.ts`).

## Contexto

- `hooks/useOperationDay.ts:69` — `useState(hoyISO)` **local** a `MonitorDiarioPage`.
- `hooks/useMonthFilter.ts:38` — `useState(mesActualISO)` **local** a `AnalisisMensualPage`.
- Al ser estados independientes, elegir un mes no afecta al día y viceversa.

## Comportamiento pedido

- Elegir **Junio 2026** en Análisis Mensual → Monitor Diario pasa a mostrar el **1 de junio de
  2026** (siempre el primer día del mes elegido).
- Elegir **22 de mayo** en Monitor Diario → Análisis Mensual pasa a mostrar **mayo 2026**.

## Diseño: una sola fuente de verdad

En vez de mantener dos estados y sincronizarlos (propenso a desfases), se guarda **una única
fecha** `YYYY-MM-DD` en un store de Zustand, y el periodo mensual se **deriva** de ella:

- `periodo = fecha.slice(0, 7)`
- elegir un mes ⇒ `fecha = ${periodo}-01`
- elegir un día ⇒ `fecha = <día elegido>`

Así la consistencia es estructural: no existe estado desde el que ambas vistas puedan discrepar.

**Criterios de aceptación**

1. Nuevo store (p. ej. `stores/dashboardDate.store.ts`) con la fecha como único estado, siguiendo
   el patrón de `stores/auth.store.ts`.
2. `useOperationDay` y `useMonthFilter` pasan a leer/escribir ese store. **Sus APIs públicas se
   mantienen** (`fecha`, `largo`, `corto`, `esHoy`, `setFecha`, `volverAHoy`; `periodo`,
   `etiqueta`, `opciones`, `esMesActual`, `setPeriodo`, `volverAlMesActual`) para no arrastrar
   cambios por toda la UI. Los helpers puros (`formatoLargo`, `hoyISO`, `etiquetaMes`,
   `mesActualISO`) se quedan donde están.
3. Elegir un mes en Análisis Mensual fija el día 1 de ese mes; al ir a Monitor Diario, la query
   `['monitor-diario', fecha]` pide ese día y el subtítulo lo refleja.
4. Elegir un día en Monitor Diario fija el mes correspondiente; al ir a Análisis Mensual, la query
   mensual pide ese periodo.
5. Navegar entre ambas vistas **sin cambiar nada** no altera la selección (ida y vuelta conserva
   el día exacto: si estabas en el 22 de mayo, vuelves al 22 de mayo, no al 1 de mayo).
6. `volverAHoy` fija hoy (y, por derivación, el mes en curso). `volverAlMesActual` fija el **día 1
   del mes en curso**; en consecuencia `esHoy` pasa a ser falso salvo que hoy sea día 1. Es la
   consecuencia lógica de la regla "al elegir mes, día 1"; se acepta explícitamente.
7. El valor inicial del store es `hoyISO()`.

## Casos borde

1. **Mes fuera de las 12 opciones.** `useMonthFilter` ofrece sólo los últimos 12 meses
   (`useMonthFilter.ts:5,41-48`), pero el selector diario admite cualquier fecha pasada. Si el día
   elegido cae en un mes que no está en la lista, el `<select>` quedaría con un `value` inexistente
   (el navegador mostraría la primera opción, mintiendo sobre el estado). **Fix:** si el periodo
   derivado no está entre las opciones, se añade a la lista para que el control refleje la
   realidad. Debe haber test.
2. **No hay fechas futuras.** El calendario diario mantiene `disabled={{ after: hoy }}`, y las
   opciones mensuales siguen siendo mes actual y anteriores. El día 1 de cualquier mes ofrecido es
   siempre ≤ hoy, así que la regla del punto 3 nunca produce una fecha futura.
3. **Persistencia dentro de la sesión.** Al vivir en un store, la selección sobrevive a navegar a
   Historial/Fibex Play y volver, cosa que antes no ocurría (se reiniciaba a hoy). Se considera
   mejora, no regresión. No se persiste en `localStorage`: al recargar la página vuelve a hoy.

## Restricciones

- Mantener paleta y estilo actuales; este ticket **no cambia UI**, sólo de dónde sale el estado.
- Sin dependencias nuevas. No tocar `mesa-control-back` ni la capa de API.
- Los tests existentes de `MonitorDiarioPage`, `AnalisisMensualPage`, `OperationDatePicker` y
  `MonthFilter` deben seguir pasando. Ojo: un store de Zustand es estado global y **persiste entre
  tests**; hay que resetearlo en cada test para no crear dependencias de orden.
- TDD: test que falla primero.
