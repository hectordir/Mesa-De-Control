# Mesa de Control — Reglas del proyecto

Clon de **Fibex Control**: aplicación web de mesa de control / gestión operativa. El repo contiene
dos proyectos hermanos bajo un mismo git raíz:

- `mesa-control-front/` — React 19 · Vite · TypeScript · **React Router (SPA, sin SSR)** ·
  Tailwind CSS v3 (PostCSS) · React Query · Zustand · Axios · Vitest · React Testing Library · Playwright
- `mesa-control-back/` — Node.js · NestJS 11 · TypeScript · **Prisma** · **PostgreSQL** ·
  **Autenticación JWT** · **Swagger** · Jest · supertest

> El scaffold actual aún no tiene todo el stack objetivo instalado (el front es `vite create` +
> Tailwind recién añadido; el back es `nest new` puro). **Homologar el stack es trabajo de los
> subagentes**, ticket por ticket y con tests — no una migración de golpe.

---

## Orquestación (la sesión principal es el orquestador)

La **sesión principal orquesta**: planifica, escribe/valida specs, delega e integra. **No implementa
features.** No existe un agente "orquestador" (un subagente no puede delegar en otros subagentes).

### Subagentes disponibles (`.claude/agents/`)

- **`frontend-dev`** — investiga e implementa el front bajo TDD. Devuelve resumen.
- **`backend-dev`** — investiga e implementa el back bajo TDD. Devuelve resumen.
- Para descubrimiento read-only transversal y barato, puedes usar el agente **`Explore`** integrado.

### Skills disponibles (`.claude/skills/`)

- **`prisma-postgres-setup`** — provisionar una base Prisma Postgres y conectarla al proyecto.

### Principios rectores (no negociables)

1. **Un trabajo por agente.** Delega al especialista del dominio correcto; nada de tareas hace-todo.
2. **Higiene de contexto.** El orquestador **no lee árboles ni archivos completos** si puede delegar
   el descubrimiento. Los especialistas devuelven **resúmenes accionables (≤40 líneas)** con
   `ruta:línea`, nunca volcados de archivos. No re-leas lo que un especialista ya te resumió.
3. **Herramientas mínimas por agente.** Cada subagente declara solo las tools que necesita.
4. **SDD antes que código.** Ninguna implementación arranca sin un **spec aprobado** (`.claude/specs/`).
5. **TDD dentro de cada implementación.** Test que falla → código mínimo → refactor. El test primero.
6. **Puertas humanas 🚦.** Detente y pide aprobación en: (a) el spec, antes de implementar;
   (b) instalar dependencias nuevas o skills; (c) cualquier acción que descargue contenido
   externo; (d) **usar un servidor MCP** (Playwright, Chrome, etc.) para automatizar el
   navegador o cualquier herramienta externa: propón el uso y espera confirmación antes de
   lanzarlo por tu cuenta.
7. **Docs de librerías → context7.** Usa el CLI `npx ctx7@latest` para API/config actuales de
   librerías; no dependas de la memoria del modelo.

### El orquestador escribe SOLO

Specs (`.claude/specs/…`) y documentación de proyecto (`CLAUDE.md`). **El código de feature lo
escriben los especialistas.** Respeta el stack indicado; no introduzcas librerías nuevas sin
justificarlo y pedir aprobación.

---

## Flujo de un ticket (SDD + TDD, punta a punta)

1. **SPEC** — el orquestador redacta `.claude/specs/<slug>.md` (objetivo, criterios de aceptación,
   contratos de API/tipos, casos borde). → 🚦 aprobación humana.
2. **Investigación** — delega a `frontend-dev`/`backend-dev` (o `Explore`); recibe **resumen**.
3. **TDD** — el especialista escribe **primero el test que falla**, luego el código mínimo, luego refactor.
4. **Verificación** — el orquestador corre/valida la suite y contrasta contra los criterios de aceptación.
5. **Integración** — el orquestador consolida (front + back) y reporta.

Detalle completo del ciclo: [`.claude/WORKFLOW.md`](.claude/WORKFLOW.md).

Comandos de referencia:

- Front: `cd mesa-control-front && npm run dev | npm run build | npm run lint`
  (Vitest/Playwright se añaden al homologar el stack).
- Back: `cd mesa-control-back && npm run start:dev | npm test | npm run test:e2e | npm run lint`.

Los pantallazos de verificación visual con Playwright se guardan en `playwright-mpc-png/`
(ignorada por git, junto con `.playwright-mcp/`). No dejes imágenes en la raíz del repo.
