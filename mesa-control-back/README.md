# mesa-control-back

API de **Mesa de Control** (clon de Fibex Control). NestJS 11 · TypeScript · Prisma ·
PostgreSQL · JWT · Swagger · Jest + supertest.

## Puesta en marcha local

```bash
npm install                 # postinstall corre `prisma generate`
cp .env.example .env        # completa JWT_SECRET y DATABASE_URL
npm run db:up               # Postgres local (docker-compose.yml, sin SSL)
npm run prisma:migrate      # migraciones en desarrollo
npm run prisma:seed         # datos demo (SOLO desarrollo)
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs` (desactivado si `NODE_ENV=production`)
- Healthcheck: `GET /health` → `200 {"status":"ok"}` (público, sin JWT, no toca la base)

## Scripts

| Script | Qué hace |
| --- | --- |
| `npm run build` / `start:prod` | compila a `dist/` / arranca `dist/main` (no migra) |
| `npm run db:up` / `db:down` | Postgres local con Docker |
| `npm run prisma:migrate` | `prisma migrate dev` (solo desarrollo, interactivo) |
| `npm run db:deploy` | `prisma migrate deploy` — no interactivo, para releases |
| `npm run prisma:seed` | seed de demo — **prohibido en producción** |
| `npm run bootstrap:admin` | crea el primer usuario `ADMIN`, idempotente |
| `npm run lint` / `test` / `test:e2e` | ESLint / unit (Jest) / e2e (supertest) |

## Variables de entorno

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `DATABASE_URL` | sí | en Railway: `${{ Postgres.DATABASE_URL }}`. Con `?sslmode=require` se activa TLS |
| `JWT_SECRET` | sí | secreto largo y aleatorio; la app no arranca sin él |
| `JWT_EXPIRES_IN` | no | p. ej. `1h` |
| `NODE_ENV` | recomendada | `production` desactiva `/api/docs` |
| `PORT` | no | la inyecta Railway; el server escucha en `0.0.0.0` |
| `CORS_ORIGIN` | recomendada | lista separada por comas; default `http://localhost:5173` |
| `CORS_ALLOW_VERCEL_PREVIEWS` | no | `true` acepta `https://*.vercel.app` (default cerrado) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | solo bootstrap | contraseña ≥ 8 caracteres; `ADMIN_NAME` opcional |

## Deploy en Railway

Postgres gestionado con el plugin **Postgres** en el mismo proyecto; el backend lo referencia
por variable de servicio.

**Ajustes del servicio** (dashboard de Railway → Settings):

| Ajuste | Valor |
| --- | --- |
| Root Directory | `mesa-control-back` |
| Build Command | `npm ci && npm run build` (el `postinstall` ya corre `prisma generate`) |
| Pre-deploy / Release Command | `npm run db:deploy` |
| Start Command | `npm run start:prod` |
| Healthcheck Path | `/health` |

**Variables** (Settings → Variables):

```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
JWT_SECRET=<secreto largo y aleatorio>
JWT_EXPIRES_IN=1h
NODE_ENV=production
CORS_ORIGIN=https://mesa-de-control.vercel.app
CORS_ALLOW_VERCEL_PREVIEWS=true      # opcional, para los preview deploys de Vercel
```

`PORT` la inyecta Railway: no la definas a mano.

**Primer usuario admin** (una sola vez, tras el primer deploy): define `ADMIN_EMAIL` y
`ADMIN_PASSWORD` en el servicio y ejecuta `npm run bootstrap:admin` (Railway CLI:
`railway run npm run bootstrap:admin`). Es idempotente: si el email ya existe no lo duplica
ni lo sobrescribe. Borra ambas variables después.

Notas de operación:

- Las migraciones **no** corren al arrancar: son el paso de release (`db:deploy`). Sin
  migraciones pendientes es un no-op con exit 0.
- El seed de demo (`prisma/seed.ts`) **nunca** se ejecuta en producción.
- El healthcheck no consulta la base: una caída de Postgres no recicla el contenedor en bucle.
