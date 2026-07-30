# Spec: Vercel Web Analytics en el frontend

- **Slug:** `vercel-web-analytics`
- **Estado:** Aprobado (2026-07-30) · **Implementado y verificado en local (2026-07-30)** ·
  pendiente de habilitar el producto en el dashboard de Vercel (acción humana)
- **Dominio(s):** frontend
- **Ticket(s) derivados:** front: `frontend-dev` (todo este spec)
- **Relacionado:** [`deploy-front-vercel.md`](deploy-front-vercel.md) (completado; front vivo en
  `https://mesa-control-front.vercel.app`)

## 1. Objetivo

Instrumentar la SPA con **Vercel Web Analytics** para ver tráfico real (visitas, rutas más usadas,
referrers, dispositivos) desde el dashboard de Vercel. **No incluye** Speed Insights, ni activar el
producto en el dashboard de Vercel (acción humana).

Decisiones tomadas (🚦 confirmadas con el humano):

- **Solo Web Analytics** (`@vercel/analytics`). Speed Insights queda descartado en este ticket.
- **Alcance: toda la app**, incluidas las rutas autenticadas.

## 2. Dependencia nueva 🚦

Este ticket **introduce una dependencia**, lo que exige aprobación explícita (regla 6b del
proyecto). No hay alternativa razonable dentro del stack actual: el script de Vercel Analytics
necesita servirse desde el propio dominio del deploy y el paquete oficial es quien lo inyecta y
gestiona su ciclo de vida.

| Paquete | Tipo | Peso aprox. | Justificación |
| --- | --- | --- | --- |
| `@vercel/analytics` | `dependencies` | ~1 kB gzip | Cliente oficial; inyecta el script y reporta las vistas de página |

Notas relevantes:

- **No requiere backend**: los eventos van a la infraestructura de Vercel, nunca a
  `mesa-de-control.up.railway.app`. **No hay que tocar `CORS_ORIGIN`.**
- **Solo funciona en el deploy de Vercel.** En `localhost` el componente no envía nada (o lo hace en
  modo debug por consola). Esto condiciona el plan de tests: se verifica el **montaje**, no la
  entrega de eventos.
- **Privacidad:** Vercel Web Analytics no usa cookies ni fingerprinting y no persiste
  identificadores entre sesiones. Sí registra la **ruta visitada**. Al ser una herramienta interna,
  se acepta que aparezcan rutas como `/fibex-play/gestion` en el panel.
- **Coste:** el plan Hobby incluye una cuota mensual de eventos limitada. Superarla degrada el
  reporte, no la app.

## 3. Criterios de aceptación

- [ ] `@vercel/analytics` está en `dependencies` de `mesa-control-front/package.json` (no en
      `devDependencies`: se necesita en el bundle de producción).
- [ ] El componente `<Analytics />` se monta **una sola vez** en la raíz de la app, por encima del
      router, de modo que cubra todas las rutas.
- [ ] Un test verifica que el componente se monta dentro del árbol de la aplicación.
- [ ] El registro de vistas **sigue los cambios de ruta del SPA**: navegar de `/dashboard` a
      `/historial` cuenta como una vista nueva sin recargar la página.
- [ ] Ningún test existente se rompe: la suite completa sigue en verde (referencia actual:
      75 ficheros / 902 tests).
- [ ] El analytics **no interfiere con el entorno de test**: los tests no hacen peticiones de red
      reales ni ensucian la consola.
- [ ] `README.md` del front documenta que Web Analytics está activo, que hay que **habilitarlo en
      el dashboard de Vercel** para que reporte, y que en local no envía datos.
- [ ] `npm run build`, `npm run lint` y `npm test` pasan en verde.
- [ ] El bundle de producción no crece de forma significativa (referencia actual: 754,85 kB; se
      acepta el sobrecoste del paquete, del orden de 1–2 kB).

## 4. Contratos

```tsx
// Montaje único, por encima del router, para cubrir todas las rutas.
// La ubicación exacta la decide frontend-dev tras leer src/main.tsx y src/routes/AppRouter.tsx.
import { Analytics } from '@vercel/analytics/react'

<>
  <AppRouter />
  <Analytics />
</>
```

> **Ruta de import: CONFIRMADA sin context7 (2026-07-30).** Se verificó contra el paquete ya
> instalado, que es la fuente de verdad: `node_modules/@vercel/analytics/package.json` →
> `exports["./react"]` y `typesVersions`, más `dist/react/index.d.ts`. Resultado:
> **`@vercel/analytics/react`**, export nombrado `Analytics`, declarado como `Analytics(props): null`
> (no renderiza DOM — por eso el test comprueba la invocación del componente, no nodos). Además, en
> `dist/react/index.mjs` se comprobó que sin prop `route` **no** activa `disableAutoTrack`: el script
> registra los cambios de ruta del SPA por sí solo, sin cablear nada con React Router.

## 5. Casos borde y validaciones

- **Entorno de test (jsdom):** el componente no debe intentar peticiones reales. Si hiciera falta,
  se mockea el módulo en el setup de Vitest.
- **Desarrollo local:** `npm run dev` no debe romperse ni llenar la consola de errores por no estar
  en Vercel.
- **Producto no habilitado en el dashboard:** la app funciona igual, simplemente no hay datos. No
  debe producir errores visibles al usuario.
- **Bloqueadores de anuncios:** pueden bloquear el script. La app debe seguir funcionando con
  normalidad; el analytics es estrictamente opcional.
- **Rutas con parámetros** (p. ej. `/fibex-play/gestion`): se registran tal cual. No se añade
  ninguna normalización ni enmascarado en este ticket.
- **Doble montaje:** montar `<Analytics />` en más de un sitio duplicaría las vistas. Debe estar
  exactamente una vez.

## 6. Plan de tests (rojo primero)

- **Front (Vitest):**
  - Test de montaje: renderiza la raíz de la app y verifica que `<Analytics />` forma parte del
    árbol (mockeando `@vercel/analytics/react` y comprobando que el componente fue invocado). Rojo
    primero: hoy no está montado.
  - Test de no-regresión: la app raíz sigue renderizando el router y su contenido con el componente
    presente.
- **Back:** ninguno.

## 7. Fuera de alcance

- **Speed Insights** (`@vercel/speed-insights`): descartado explícitamente en este ticket.
- Habilitar Web Analytics en el dashboard de Vercel (acción humana).
- Eventos personalizados (`track()`), embudos, objetivos o segmentación.
- Cualquier analítica de terceros (GA, Plausible, PostHog…).
- Banner de consentimiento de cookies: no aplica, el producto no usa cookies.
- Enmascarar o normalizar rutas sensibles en los informes.
- El code-splitting del bundle de 755 kB: sigue siendo deuda aparte, no se aborda aquí.
