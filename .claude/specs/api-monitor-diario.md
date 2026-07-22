# Spec — API `GET /dashboard/monitor-diario`

**Slug:** `api-monitor-diario` · **Dominio:** `mesa-control-back` (+ swap de adaptador en el front)
**Estado:** aprobado (continuación directa de `dashboard-monitor-diario`)

## Objetivo

Servir con datos reales de PostgreSQL el resumen que hoy consume `MonitorDiarioPage` desde
fixtures. El contrato ya está fijado por el front en
[`dashboard-monitor-diario.md`](dashboard-monitor-diario.md) — **el back se adapta al contrato,
no al revés.**

## Modelo de datos (Prisma)

Se añade la entidad que faltaba: la **gestión** (una atención registrada por un operador).

```prisma
enum ResultadoGestion {
  SOLUCIONADO_MESA
  ENVIADO_SOPORTE2
  ESCALADO_NOC
  PENDIENTE_CLIENTE
  REAGENDADO
}

model Gestion {
  id          String           @id @default(uuid())
  operador    User             @relation(fields: [operadorId], references: [id])
  operadorId  String
  resultado   ResultadoGestion
  motivo      String                       // motivo de avería, texto libre por ahora
  ubicacion   String
  fecha       DateTime         @db.Date     // fecha de operación (día), separada de createdAt
  createdAt   DateTime         @default(now())

  @@index([fecha])
  @@index([operadorId, fecha])
}
```

`User` gana la relación inversa `gestiones Gestion[]`. Migración nueva, sin tocar la existente.

> `fecha` (día de operación) se separa de `createdAt` (instante) a propósito: la mesa cierra el día
> a una hora que no tiene por qué coincidir con medianoche, y así las consultas por día son un
> índice y no un rango de timestamps con zona horaria.

## Endpoint

`GET /dashboard/monitor-diario?fecha=YYYY-MM-DD` — **protegido con `JwtAuthGuard`**, documentado
en Swagger, `200` con el DTO `MonitorDiarioResumenDto`:

```jsonc
{
  "fecha": "2026-07-22",
  "kpis": { "clientesAtendidos": 342, "efectividadMesa": 78, "enviadoSoporte2": 54,
            "escaladoNoc": 31, "pendienteCliente": 38 },
  "operadores": [ { "id": "…", "nombre": "Jhon Rivas", "clientes": 78, "mesa": 63,
                    "soporte2": 11, "noc": 7 } ],
  "distribucion": [ { "resultado": "SOLUCIONADO_MESA", "total": 198 } ],
  "topAverias":  [ { "motivo": "Corte de fibra (FTTH)", "total": 84 } ],
  "actividad":   [ { "id": "…", "operador": "Jhon Rivas", "resultado": "SOLUCIONADO_MESA",
                     "ubicacion": "Cond. Los Robles", "hora": "2026-07-22T10:42:00.000Z" } ]
}
```

Reglas de agregación (todas sobre las gestiones de esa `fecha`):
- `clientesAtendidos` = total de gestiones del día.
- `efectividadMesa` = `round(SOLUCIONADO_MESA / total * 100)`; `0` si no hay gestiones.
- `enviadoSoporte2` / `escaladoNoc` / `pendienteCliente` = conteo por resultado.
- `operadores`: agrupado por operador, ordenado por `clientes` desc; `mesa`/`soporte2`/`noc` son
  los conteos de sus resultados. **Solo operadores con al menos una gestión ese día.**
  `efectividad` e `iniciales` **no** se envían: los deriva el front.
- `distribucion`: un item por cada uno de los 5 valores del enum, **incluidos los que valen 0**
  (así la leyenda del donut no cambia de tamaño entre días).
- `topAverias`: agrupado por `motivo`, orden desc por total, **máximo 5**; desempate alfabético.
- `actividad`: las **20** gestiones más recientes por `createdAt` desc.
- Día sin gestiones → `200` con arrays vacíos y KPIs en `0` (es el estado `empty` del front, **no**
  un `404`).

**Validación:** `fecha` opcional; si falta, hoy. Formato `YYYY-MM-DD` estricto vía DTO con
`class-validator`; formato inválido → `400`. Sin token → `401`.

## Seed

Ampliar `prisma/seed.ts` (idempotente, como el actual) con ~5 operadores y gestiones del **día
actual** que reproduzcan los números del diseño (342 gestiones: 198/54/31/38/21) y los 5 motivos
de avería. Debe poder ejecutarse dos veces sin duplicar.

## Swap en el front

Único cambio: `src/lib/api/dashboard.ts` llama al endpoint con el cliente Axios existente (el
interceptor ya adjunta el token). Se borra `src/features/dashboard/fixtures.ts` y los tests que
lo usaban pasan a montar la respuesta como mock del adaptador. **Ningún componente cambia.**

## Criterios de aceptación

1. Back: `npm run lint`, `npm test` (unit) y `npm run test:e2e` verdes.
2. Tests escritos **antes** del código:
   - e2e: sin token → `401`; con token y día con datos → `200` y la forma exacta del DTO;
     día sin gestiones → `200` con KPIs en `0`, `operadores`/`topAverias`/`actividad` vacíos y
     `distribucion` con los 5 resultados en `0`; `fecha=cualquier-cosa` → `400`.
   - unit del service: efectividad con `0` gestiones, orden y corte a 5 de `topAverias`,
     corte a 20 de `actividad`, `distribucion` incluye los resultados sin gestiones.
3. La migración aplica limpia sobre una base vacía y el seed es idempotente (ejecutarlo dos veces
   deja el mismo conteo).
4. Front: `npm run lint`, `npm test` y `npm run build` verdes tras el swap; `fixtures.ts` eliminado.
5. Verificación end-to-end en navegador: login real → `/dashboard` muestra los datos de Postgres.

## Fuera de alcance

Crear/editar gestiones (`POST /gestiones` es el ticket de "Registro Nueva Gestión"), filtros por
empresa, análisis mensual, reporte Telegram y cualquier cambio de UI.
