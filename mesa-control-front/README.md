# mesa-control-front

Frontend de **Mesa de Control**: React 19 · Vite · TypeScript · React Router (SPA, sin SSR) ·
Tailwind CSS v3 · React Query · Zustand · Axios. Tests con Vitest + React Testing Library
(unit/componente) y Playwright (e2e, en `e2e/`).

## Desarrollo

```bash
npm install
cp .env.example .env      # ajusta VITE_API_URL si el back no está en localhost:3000
npm run dev               # servidor de desarrollo
npm run build             # tsc -b && vite build  → dist/
npm run lint
npm test                  # vitest run
```

## Variables de entorno

| Variable       | Ejemplo                                   | Notas                              |
| -------------- | ----------------------------------------- | ---------------------------------- |
| `VITE_API_URL` | `https://mesa-de-control.up.railway.app`  | URL base del API. Sin barra final. |

Reglas de las variables `VITE_*` (Vite):

- **Son de BUILD, no de runtime.** Vite las sustituye literalmente en el bundle durante
  `vite build`. **Cambiarlas en el panel de Vercel no surte efecto hasta un nuevo deploy**
  (Redeploy sin caché).
- **Son públicas.** Acaban en el JavaScript que descarga el navegador: cualquiera puede leerlas.
  **Nunca metas secretos** (claves de API privadas, credenciales de BD) en una `VITE_*`.
- Si `VITE_API_URL` queda vacía o con solo espacios, el cliente cae al default de desarrollo
  `http://localhost:3000` en vez de dejar la base vacía (ver `src/lib/api/client.ts`).
  La barra final se recorta, así que `https://api.com/` y `https://api.com` son equivalentes.

## Deploy en Vercel

El proyecto se importa desde el dashboard de Vercel (no se usa la CLI). Ajustes del proyecto:

| Ajuste                | Valor                                    |
| --------------------- | ---------------------------------------- |
| Root Directory        | `mesa-control-front`                     |
| Framework Preset      | Vite                                     |
| Build Command         | `npm run build` (`tsc -b && vite build`) |
| Output Directory      | `dist`                                   |
| Install Command       | `npm install` (por defecto)              |
| Production Branch     | `main`                                   |
| Environment Variable  | `VITE_API_URL = https://mesa-de-control.up.railway.app` |

### Fallback de rutas (SPA)

`vercel.json` declara un rewrite catch-all:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

El router usa `createBrowserRouter` (history API real), así que en un hosting estático
`GET /dashboard` buscaría un fichero inexistente: sin el rewrite, **recargar (F5) en cualquier
ruta interna daría 404** aunque la navegación por clics funcione. El orden de routing de Vercel es
`redirects` → **filesystem** → `rewrites`, por lo que los assets reales (`/assets/*.js`,
`/assets/*.css`, ficheros de `public/`) se sirven antes de que el catch-all entre en juego.
`vercel.config.test.ts` vigila que ese fichero no desaparezca.

### Después del primer deploy

Añadir la URL de Vercel a `CORS_ORIGIN` en Railway (backend), o el navegador bloqueará las
llamadas al API.
