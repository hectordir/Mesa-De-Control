# Spec: Preparar el backend para deploy en Railway

- **Slug:** `deploy-back-railway`
- **Estado:** Aprobado (2026-07-30) · **Completado y verificado (2026-07-30)**
- **Dominio(s):** backend
- **Ticket(s) derivados:** back: `backend-dev` (todo este spec) · front: pendiente (spec aparte para Vercel)

## 1. Objetivo

Dejar `mesa-control-back` listo para correr en Railway con Postgres gestionado: migraciones
aplicadas de forma no interactiva en cada release, healthcheck para el balanceador, CORS que
acepte el dominio de producción de Vercel y sus preview deploys, Swagger cerrado en producción y
una vía idempotente para crear el primer usuario admin. **No incluye** crear el proyecto en
Railway ni configurar el front.

Decisiones tomadas (🚦 confirmadas con el humano):

- **Base de datos:** plugin **Postgres de Railway** en el mismo proyecto → `DATABASE_URL` por
  referencia de servicio.
- **Admin inicial:** script de bootstrap idempotente, separado del seed de desarrollo.
- **Swagger:** desactivado cuando `NODE_ENV === 'production'`.

## 2. Criterios de aceptación

- [x] Existe `npm run db:deploy` → `prisma migrate deploy` (no interactivo, sin `migrate dev`).
- [x] `npm run start:prod` sigue arrancando `dist/main` y **no** ejecuta migraciones por sí mismo
      (las migraciones son un paso de release separado, documentado).
- [x] `main.ts` escucha en `'0.0.0.0'` con el puerto de `process.env.PORT`.
- [x] Existe `GET /health` que responde `200 { status: 'ok' }` **sin JWT** y sin tocar la DB.
- [x] `configureApp` acepta múltiples orígenes CORS: `CORS_ORIGIN` admite lista separada por comas
      y un origen `https://<algo>.vercel.app` es aceptado vía patrón de previews.
- [x] Un origen no listado es **rechazado** (no se refleja en `Access-Control-Allow-Origin`).
- [x] Con `NODE_ENV=production`, `/api/docs` responde 404; en cualquier otro entorno sigue sirviendo
      Swagger.
- [x] `PrismaService` aplica SSL cuando la connection string lo requiere (`sslmode=require`) sin
      romper el Postgres local de `docker-compose.yml`.
- [x] Existe `npm run bootstrap:admin` que crea un usuario `ADMIN` desde `ADMIN_EMAIL` /
      `ADMIN_PASSWORD` (bcrypt) y es **idempotente**: segunda ejecución no duplica ni sobrescribe.
- [x] Falla con mensaje claro si `ADMIN_EMAIL` o `ADMIN_PASSWORD` no están definidos.
- [x] `.env.example` documenta las variables nuevas y su forma en producción.
- [x] `README.md` del back documenta el deploy en Railway: Root Directory = `mesa-control-back`,
      build, start, release command, healthcheck path y variables requeridas.
- [x] `npm run lint` ✅ · `npm test` ✅ (25 suites / 296 tests) · `npm run test:e2e` ✅
      (14 suites / 118 tests, contra el Postgres de `docker compose`). Verificado 2026-07-30.

## 3. Contratos (API / tipos)

```ts
// Endpoint nuevo: GET /health  → 200 { status: 'ok' }   (público, sin JWT, sin DB)
//   Se documenta en Swagger (@ApiOperation) pero es accesible siempre.

// Variables de entorno en Railway (Service: mesa-control-back)
//   DATABASE_URL      ← referencia al plugin Postgres: ${{ Postgres.DATABASE_URL }}
//   JWT_SECRET        ← secreto largo y aleatorio (obligatorio, ya validado en env.validation.ts)
//   JWT_EXPIRES_IN    ← "1h"
//   NODE_ENV          ← "production"
//   PORT              ← lo inyecta Railway; no fijarlo a mano
//   CORS_ORIGIN       ← "https://mesa-de-control.vercel.app" (lista separada por comas admitida)
//   CORS_ALLOW_VERCEL_PREVIEWS ← "true" para aceptar https://*.vercel.app
//   ADMIN_EMAIL / ADMIN_PASSWORD ← solo para la ejecución única de bootstrap:admin

// Ajustes del servicio en Railway (no van en código, van al README)
//   Root Directory:    mesa-control-back
//   Build Command:     npm ci && npm run build      (postinstall ya corre prisma generate)
//   Release/Pre-deploy: npm run db:deploy
//   Start Command:     npm run start:prod
//   Healthcheck Path:  /health
```

## 4. Casos borde y validaciones

- `CORS_ORIGIN` ausente → se mantiene el default de desarrollo `http://localhost:5173`.
- `CORS_ORIGIN` con espacios alrededor de las comas → se normaliza (trim) y funciona igual.
- Petición sin header `Origin` (curl, healthcheck del balanceador) → permitida, no debe fallar.
- Origen `https://evil.com` con previews activados → rechazado (el patrón solo cubre
  `*.vercel.app`).
- `CORS_ALLOW_VERCEL_PREVIEWS` no definido → previews **no** permitidos (default cerrado).
- `bootstrap:admin` con un email ya existente que **no** es `ADMIN` → no lo degrada ni lo pisa;
  informa y termina con éxito.
- `bootstrap:admin` con `ADMIN_PASSWORD` corta (< 8 caracteres) → falla antes de escribir en la DB.
- `DATABASE_URL` sin `sslmode` (Postgres local en Docker) → conecta sin SSL, como hoy.
- `prisma migrate deploy` sin migraciones pendientes → no-op, exit 0.
- `NODE_ENV=test` → Swagger sigue montado; los e2e existentes que dependan de `configureApp` no se
  rompen.

## 5. Fuera de alcance

- Crear el proyecto/servicio en Railway y pegar variables en su dashboard (acción humana).
- Deploy del front en Vercel y su `VITE_API_URL` → spec aparte.
- Dominio propio, CDN, rate limiting, logging estructurado, observabilidad/APM.
- Backups, réplicas o pooling avanzado de Postgres.
- Ejecutar el seed de demo (`prisma/seed.ts`) en producción: queda explícitamente prohibido.
- CI/CD propio (GitHub Actions); se usa el deploy nativo de Railway sobre la rama.

## 6. Plan de tests (rojo primero)

- **Back (unit, Jest):**
  - `setup.spec.ts` — resolución de orígenes CORS: lista con comas, trim, preview `*.vercel.app`
    permitido solo con el flag, origen desconocido rechazado, sin `Origin` permitido.
  - `setup.spec.ts` — Swagger: con `NODE_ENV=production` no se llama a `SwaggerModule.setup`; en
    otros entornos sí.
  - `bootstrap-admin.spec.ts` — crea el admin con hash bcrypt; segunda ejecución no duplica; falla
    sin `ADMIN_EMAIL`/`ADMIN_PASSWORD`; falla con contraseña < 8 caracteres.
  - `prisma.service.spec.ts` — se pasa configuración SSL al adapter solo si la URL la pide.
- **Back (e2e, supertest):**
  - `GET /health` → 200 `{ status: 'ok' }` sin token.
  - Petición con `Origin` permitido → refleja `Access-Control-Allow-Origin`; con origen no
    permitido → no lo refleja.
- **Front:** ninguno (spec de Vercel aparte).

## 7. Notas de homologación de stack

Ninguna dependencia nueva. Todo se resuelve con lo ya instalado (`@nestjs/config`, `@prisma/client`
+ `@prisma/adapter-pg`, `bcrypt`, `dotenv`, Jest, supertest). Si `backend-dev` considera necesario
añadir `@nestjs/terminus` para el healthcheck, **debe pedir aprobación** antes: el criterio actual
(`/health` sin DB) no lo requiere.
