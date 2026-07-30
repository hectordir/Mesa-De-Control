# Spec: Preparar el frontend para deploy en Vercel

- **Slug:** `deploy-front-vercel`
- **Estado:** Aprobado (2026-07-30) · **Completado y verificado en producción (2026-07-30)**
- **Producción:** front `https://mesa-control-front.vercel.app` → API `https://mesa-de-control.up.railway.app`
- **Dominio(s):** frontend
- **Ticket(s) derivados:** front: `frontend-dev` (todo este spec)
- **Relacionado:** [`deploy-back-railway.md`](deploy-back-railway.md) (completado; back vivo en
  `https://mesa-de-control.up.railway.app`)

## 1. Objetivo

Dejar `mesa-control-front` listo para desplegarse en Vercel como SPA sobre el backend ya
desplegado en Railway: fallback de rutas para que las URLs profundas y los refrescos no den 404,
consumo robusto de `VITE_API_URL` y documentación de los ajustes del proyecto en Vercel.
**No incluye** crear el proyecto en Vercel ni pegar variables en su dashboard (acción humana).

Contexto que motiva el ticket:

- `src/routes/routes.tsx:79` usa `createBrowserRouter` → history API real. En un hosting estático,
  `GET /dashboard` busca un fichero que no existe. Sin rewrite, **recargar (F5) en cualquier ruta
  interna devuelve 404**; la navegación por clics sí funciona, lo que hace el fallo desconcertante.
- `src/lib/api/client.ts:6` resuelve la base con `import.meta.env.VITE_API_URL ?? '…'`. `??` solo
  cubre `undefined`/`null`: una variable **definida pero vacía** en el panel de Vercel deja
  `baseURL = ''` y las llamadas se dirigirían al dominio del front en vez de al API.

## 2. Criterios de aceptación

- [ ] Existe `mesa-control-front/vercel.json` con un rewrite que sirve `index.html` para cualquier
      ruta no resuelta por el filesystem.
- [ ] El rewrite **no** intercepta los assets construidos: `/assets/*.js`, `/assets/*.css` y los
      ficheros de `public/` siguen sirviéndose tal cual.
- [ ] Un test verifica que `vercel.json` es JSON válido y declara el rewrite catch-all hacia
      `/index.html` (guard contra borrados accidentales del fichero).
- [ ] `API_BASE_URL` cae al default `http://localhost:3000` cuando `VITE_API_URL` es `undefined`
      **o cadena vacía / solo espacios**.
- [ ] `API_BASE_URL` normaliza la barra final: `https://api.com/` y `https://api.com` producen la
      misma URL efectiva al llamar un endpoint (`…/auth/login`, nunca `…//auth/login`).
- [ ] `README.md` del front documenta el deploy en Vercel: Root Directory = `mesa-control-front`,
      framework preset, build command, output directory, `VITE_API_URL` y la naturaleza
      **de build** (no de runtime) de las variables `VITE_*`.
- [ ] `.env.example` documenta `VITE_API_URL` con su forma en producción.
- [ ] `npm run build`, `npm run lint` y `npm test` pasan en verde.

## 3. Contratos

```jsonc
// mesa-control-front/vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

El orden de routing de Vercel es `redirects` → **filesystem** → `rewrites`. Por eso el catch-all es
seguro: los assets reales se sirven antes de que el rewrite entre en juego.

> **Verificación diferida → CONFIRMADA en producción (2026-07-30).** Se descartó context7 y se
> comprobó contra el deploy real en `https://mesa-control-front.vercel.app`:
> `/` → 200 `text/html`; `/dashboard` (deep link directo) → **200 `text/html`, no 404** → el rewrite
> funciona; `/assets/index-*.js` → 200 `application/javascript` → el catch-all **no** intercepta los
> assets, el filesystem tiene prioridad. El esquema era correcto.

```ts
// src/lib/api/client.ts — contrato de resolución de la base del API
// Entrada: import.meta.env.VITE_API_URL
//   undefined | '' | '   '  → 'http://localhost:3000'
//   'https://x.up.railway.app/'  → equivalente a 'https://x.up.railway.app'
// La firma pública (API_BASE_URL, api, attachAuthToken, handleUnauthorized) no cambia.
```

```
// Ajustes del proyecto en Vercel (no van en código, van al README)
//   Root Directory:      mesa-control-front
//   Framework Preset:    Vite
//   Build Command:       npm run build      (tsc -b && vite build)
//   Output Directory:    dist
//   Production Branch:   main
//   Environment Variable: VITE_API_URL = https://mesa-de-control.up.railway.app
```

## 4. Casos borde y validaciones

- Entrada directa a `/dashboard`, `/registro`, `/historial`, `/fibex-play/gestion`, `/admin` →
  carga la SPA (no 404). Son las rutas declaradas en `routes.tsx:16-76`.
- Refresco (F5) estando en una ruta interna → mismo resultado.
- Ruta inexistente (`/loquesea`) → sirve la SPA y el catch-all `path: '*'` de React Router redirige
  a `/login`. El 404 lo decide la app, no el hosting.
- `VITE_API_URL` con barra final (el dominio de Railway se copia así del dashboard) → no produce
  doble barra. Axios ya normaliza al combinar `baseURL` + `url`; el test **fija** ese
  comportamiento para que un cambio futuro de cliente HTTP no lo rompa en silencio.
- `VITE_API_URL` definida pero vacía → default de desarrollo, no `baseURL` vacía.
- Assets con hash (`/assets/index-a1b2c3.js`) → servidos como estáticos, no como `index.html`
  (si el rewrite los tragara, la app cargaría HTML donde espera JS y quedaría en blanco).

## 5. Fuera de alcance

- Crear el proyecto en Vercel, importar el repo y pegar variables en su dashboard (acción humana).
- Poner `CORS_ORIGIN` en Railway con la URL definitiva de Vercel (acción humana, paso 3 de la guía).
- Dominio propio, cabeceras de caché/seguridad, CSP, analytics, ISR o funciones serverless.
- Tests e2e con Playwright contra el deploy real.
- Cualquier cambio de UI, rutas o features: este ticket es solo de despliegue.
- Migrar a `HashRouter` para esquivar el problema: se descarta explícitamente (empeora las URLs).

## 6. Plan de tests (rojo primero)

- **Front (Vitest):**
  - `vercel.config.test.ts` — lee `vercel.json`, valida que parsea y que existe un rewrite cuyo
    `source` cubre cualquier ruta y cuyo `destination` es `/index.html`. Rojo primero: el fichero
    aún no existe.
  - `client.test.ts` (ampliar el existente) — `VITE_API_URL` vacía o con espacios → default;
    con barra final → la URL efectiva de una petición no duplica la barra.
- **Back:** ninguno.

## 7. Notas de homologación de stack

Ninguna dependencia nueva. `vercel.json` es configuración declarativa del hosting y los tests usan
Vitest, ya instalado. No se instala la CLI de Vercel: el deploy se hace desde el dashboard sobre la
rama `main`, igual que Railway.
