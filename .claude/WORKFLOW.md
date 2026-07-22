# Flujo de trabajo SDD + TDD — Mesa de Control

Cómo se construye **cualquier** tarea en este repo. La sesión principal orquesta; los subagentes
`frontend-dev` / `backend-dev` investigan e implementan. Ver principios en [`../CLAUDE.md`](../CLAUDE.md).

## El ciclo (5 pasos)

```
   ┌──────────┐   🚦    ┌──────────────┐        ┌──────────┐        ┌──────────────┐        ┌────────────┐
   │ 1. SPEC  │ ─────▶  │ 2. INVESTIGAR│ ─────▶ │ 3. TDD   │ ─────▶ │ 4. VERIFICAR │ ─────▶ │ 5. INTEGRAR│
   │ (orq.)   │ apruebas│ (especialista│        │ (espec.) │        │ (orquestador)│        │ (orquest.) │
   └──────────┘         │  → resumen)  │        │ rojo→    │        │ suite +      │        │ consolida  │
                        └──────────────┘        │ verde→   │        │ criterios    │        │ + reporta  │
                                                │ refactor │        └──────────────┘        └────────────┘
                                                └──────────┘
```

1. **SPEC** — el orquestador redacta `.claude/specs/<slug>.md` a partir de la plantilla
   (`_TEMPLATE.md`): objetivo, criterios de aceptación, contratos de API/tipos, casos borde.
   **🚦 Puerta: no se implementa nada sin spec aprobado por el humano.**
2. **INVESTIGAR** — el orquestador delega al especialista del dominio (o al agente `Explore`).
   El especialista explora y devuelve un **resumen ≤40 líneas** con `ruta:línea`. El orquestador
   **no carga los archivos**.
3. **TDD** — el especialista, con el spec:
   - **Rojo:** escribe primero el/los test(s) que fallan. Los corre y confirma el fallo.
   - **Verde:** código mínimo para que pasen.
   - **Refactor:** limpia con los tests en verde.
   Nueva dependencia del stack objetivo (Vitest, Prisma, JWT, Swagger, …) → el especialista la
   **homologa** dentro del ticket, verificándola con un test. Instalar deps nuevas = 🚦 avisa al
   orquestador.
4. **VERIFICAR** — el orquestador corre/valida la suite y contrasta **cada criterio de aceptación**.
   Si algo falla, vuelve al paso 3 con un ticket de corrección.
5. **INTEGRAR** — el orquestador consolida front+back, resume el estado y reporta al humano.

## Reglas que hacen que esto funcione
- **Un ticket = una delegación** a **un** especialista. Si cruza front y back, el orquestador lo
  parte en dos tickets con un contrato compartido (tipos/endpoint) definido en el spec.
- El especialista **nunca** vuelca archivos; el orquestador **nunca** re-lee lo ya resumido.
- Ningún código sin spec aprobado; ninguna implementación sin test rojo primero.
- Docs de librerías → context7 (`npx ctx7@latest`), no memoria.

## Plantilla
- Plantilla reutilizable: [`specs/_TEMPLATE.md`](specs/_TEMPLATE.md)
