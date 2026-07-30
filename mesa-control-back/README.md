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
| `CORS_ORIGIN` | recomendada | lista separada por comas de **orígenes puros** (esquema + host, sin ruta ni `/` final); default `http://localhost:5173` |
| `CORS_ALLOW_VERCEL_PREVIEWS` | no | `true` acepta `https://*.vercel.app` (default cerrado) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | solo bootstrap | contraseña ≥ 8 caracteres; `ADMIN_NAME` opcional |

## Deploy en Railway

Postgres gestionado con el plugin **Postgres** en el mismo proyecto; el backend lo referencia
por variable de servicio.

**Producción viva:**

| Pieza | URL | Dónde vive |
| --- | --- | --- |
| Backend (esta API) | `https://mesa-de-control.up.railway.app` | Railway, carpeta `mesa-control-back/` |
| Frontend | `https://mesa-control-front.vercel.app` | Vercel, carpeta `mesa-control-front/` |

El front apunta al back con `VITE_API_URL=https://mesa-de-control.up.railway.app`, y el back
autoriza al front con `CORS_ORIGIN`. Si cambias una URL, cambia **las dos**. Specs completos:
[`.claude/specs/deploy-back-railway.md`](../.claude/specs/deploy-back-railway.md) y
[`.claude/specs/deploy-front-vercel.md`](../.claude/specs/deploy-front-vercel.md).

**Ajustes del servicio** (dashboard de Railway → Settings):

| Ajuste | Valor |
| --- | --- |
| Root Directory | `mesa-control-back` |
| Build Command | `npm ci && npm run build` (el `postinstall` ya corre `prisma generate`) |
| Pre-deploy / Release Command | `npm run db:deploy` |
| Start Command | `npm run start:prod` |
| Healthcheck Path | `/health` |
| Branch desplegada | `main` |

**Variables** (Settings → Variables):

```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
JWT_SECRET=<secreto largo y aleatorio — nunca en el repo>
JWT_EXPIRES_IN=1h
NODE_ENV=production
CORS_ORIGIN=https://mesa-control-front.vercel.app
NPM_CONFIG_PRODUCTION=false
```

`PORT` la inyecta Railway: no la definas a mano. `CORS_ALLOW_VERCEL_PREVIEWS=true` es opcional
y hoy **no** está activa en producción: actívala solo si necesitas que los preview deploys de
Vercel (`https://*.vercel.app`) puedan llamar a la API.

### `NPM_CONFIG_PRODUCTION=false`: por qué es obligatoria

Con `NODE_ENV=production`, npm omite las `devDependencies` al instalar (en los build logs se ve
como `npm warn config production Use --omit=dev instead`). Pero el build y el release de este
proyecto dependen de piezas que viven precisamente ahí:

| Paso | Necesita | Está en |
| --- | --- | --- |
| `npm run build` → `nest build` | `@nestjs/cli` | `package.json:51` |
| `postinstall` → `prisma generate` | `prisma` | `package.json:67` |
| `npm run db:deploy` → `prisma migrate deploy` | `prisma` | `package.json:67` |
| `npm run bootstrap:admin` → `ts-node --project tsconfig.scripts.json` (`package.json:27`) | `ts-node` | `package.json:72` |

`NPM_CONFIG_PRODUCTION=false` fuerza a npm a instalarlas igual. Es una variable **de
instalación, no de runtime**: `NODE_ENV` sigue valiendo `production`, así que Swagger sigue
cerrado y Nest sigue en modo producción.

El fallo es traicionero: un build puede sobrevivir sin esta variable gracias a la caché de
`node_modules` y romperse semanas después, cuando la caché se invalida, con un `nest: not found`
o `prisma: not found` aparentemente inexplicable. Ponla desde el principio.

### Operar el dashboard sin pelearte con él

- **Las variables se aplican con el botón `Deploy`, no al guardar.** Railway deja los cambios
  *staged* y muestra un banner de cambios pendientes. Si no pulsas `Deploy`, la variable aparece
  en el dashboard pero **no está en el contenedor** y la app sigue con los valores anteriores
  (o con los defaults del código).
- **No encadenes despliegues.** Cada cambio de variables aplicado y cada clic en `Redeploy`
  encola un deploy que **cancela el que esté en curso**; en los logs sale como
  `Build Failed: ... Canceled: context canceled`. El síntoma típico es un build que "tarda 10+
  minutos": en realidad son varios builds matándose entre sí. Agrupa todos los cambios, aplica
  **una sola vez** y espera a que el deploy quede en `Active`.
- **`SIGTERM` en los logs es normal.** Durante el relevo de un deploy, Railway apaga el
  contenedor viejo y npm lo reporta como `npm error signal SIGTERM`. No es un crash de la app:
  si el deploy nuevo quedó `Active` y `/health` responde, todo está bien.

### CORS: el origen tiene que ser el origen puro

`CORS_ORIGIN` admite solo **esquema + host** (`https://mesa-control-front.vercel.app`), sin
ruta y sin barra final. Si te equivocas el síntoma no es obvio: el preflight
`OPTIONS /auth/login` no hace match con ningún origen permitido, cae al router de Nest, no
encuentra ruta `OPTIONS` y devuelve **404**; el navegador reporta a la vez un 404 y un error de
CORS, y parece un problema de rutas cuando es de configuración. Con el origen correcto el
preflight responde **204**.

### Primer usuario admin

Una sola vez, tras el primer deploy. `npm run bootstrap:admin` es **idempotente**: si el email
ya existe no lo duplica ni lo sobrescribe, así que ejecutarlo de más no rompe nada.

> ⚠️ **`railway run npm run bootstrap:admin` no funciona.** El `DATABASE_URL` que Railway
> inyecta es la URL **interna** (`postgres.railway.internal`), inalcanzable desde una máquina
> local: el script muere con error de conexión. Hay que correrlo **dentro** de Railway.

**Método recomendado (dentro de Railway):**

1. Define en el servicio `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mínimo 8 caracteres) y, opcionalmente,
   `ADMIN_NAME`.
2. Cambia **temporalmente** el Pre-Deploy Command a
   `npm run db:deploy && npm run bootstrap:admin`.
3. Aplica los cambios **una sola vez** con `Deploy` y espera a que el servicio quede `Active`
   (recuerda: no encadenes despliegues).
4. Comprueba en los **Deploy Logs** el mensaje del script: `Usuario ADMIN <email> creado.` o
   `El usuario <email> ya existe con rol ADMIN: no se modifica.`
5. Entra a la app con esas credenciales y **cambia la contraseña**.
6. Revierte el Pre-Deploy Command a `npm run db:deploy` y **borra las tres variables**
   (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`).

Borrar esas variables **no borra el usuario**: son solo la entrada del script; la fila ya vive
en la tabla `User` de Postgres.

**Alternativa desde local:** ejecuta el script apuntando a `DATABASE_PUBLIC_URL` —la URL de
acceso externo que expone el bloque Postgres— en lugar de `DATABASE_URL`.

### Smoke test post-deploy

Con el deploy en `Active`, estos cinco chequeos confirman que el release está sano. Cada uno
prueba una cosa distinta:

| Chequeo | Esperado | Qué demuestra |
| --- | --- | --- |
| `GET /health` | `200 {"status":"ok"}` | el contenedor arrancó y sirve tráfico |
| `GET /api/docs` | `404` | Swagger cerrado ⇒ `NODE_ENV=production` sí llegó al contenedor |
| `POST /auth/login` con credenciales falsas | **`401`, no `500`** | la app habla con Postgres y las migraciones corrieron; un `500` delata DB caída o sin migrar |
| `OPTIONS /auth/login` con `Origin: https://mesa-control-front.vercel.app` | `204` | el preflight del front está permitido |
| lo mismo con un `Origin` desconocido | sin cabecera `Access-Control-Allow-Origin` | la allowlist no está abierta de par en par |

```bash
BASE=https://mesa-de-control.up.railway.app
FRONT=https://mesa-control-front.vercel.app

curl -s -o /dev/null -w '%{http_code}\n' "$BASE/health"
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/api/docs"
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' -d '{"email":"nope@example.com","password":"wrongpass"}'
curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "$BASE/auth/login" \
  -H "Origin: $FRONT" -H 'Access-Control-Request-Method: POST'
curl -si -X OPTIONS "$BASE/auth/login" \
  -H 'Origin: https://evil.example.com' -H 'Access-Control-Request-Method: POST' \
  | grep -i 'access-control-allow-origin' || echo 'sin ACAO (correcto)'
```

Notas de operación:

- Las migraciones **no** corren al arrancar: son el paso de release (`db:deploy`). Sin
  migraciones pendientes es un no-op con exit 0.
- El seed de demo (`prisma/seed.ts`) **nunca** se ejecuta en producción.
- El healthcheck no consulta la base: una caída de Postgres no recicla el contenedor en bucle.
