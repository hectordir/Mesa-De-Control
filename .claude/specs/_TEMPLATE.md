# Spec: <título de la feature>

- **Slug:** `<kebab-case>`
- **Estado:** 🚦 Borrador | Aprobado | En progreso | Hecho
- **Dominio(s):** frontend | backend | ambos
- **Ticket(s) derivados:** <front: …> · <back: …>

## 1. Objetivo
<1–3 frases: qué valor entrega al usuario y por qué.>

## 2. Criterios de aceptación
Lista verificable (cada uno se traduce en al menos un test):
- [ ] <criterio observable 1>
- [ ] <criterio observable 2>

## 3. Contratos (API / tipos)
Fuente de verdad compartida entre front y back. Sé explícito.
```ts
// Tipos / DTO
// Endpoint: MÉTODO /ruta  → request / response / status
// ¿Requiere JWT? ¿qué rol?  → documentar en Swagger
```

## 4. Casos borde y validaciones
- <entrada inválida → comportamiento esperado>
- <no autenticado / sin permisos → 401 / 403>
- <límite, vacío, error de red / DB, etc.>

## 5. Fuera de alcance
- <lo que este spec NO cubre>

## 6. Plan de tests (rojo primero)
- **Back:** <tests unit/e2e (supertest) a escribir antes del código>
- **Front:** <tests RTL/Vitest o Playwright a escribir antes del código>

## 7. Notas de homologación de stack
<¿este ticket requiere instalar algo del stack objetivo aún ausente? (Vitest, React Query, Axios,
Prisma, JWT, Swagger, …)>
