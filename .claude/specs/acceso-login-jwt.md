# Spec: Acceso — login con JWT (Fibex Control)

- **Slug:** `acceso-login-jwt`
- **Estado:** Aprobado (2026-07-21)
- **Dominio(s):** ambos
- **Ticket(s) derivados:** back: Prisma + User + Auth JWT + Swagger · front: `/login` (LoginPage) + Axios/React Query + guard de ruta
- **Diseño fuente:** `Acceso Fibex Control.dc.html` (Claude Design, proyecto `4d9fdaa5-…`), variantes 1a (oscuro) y 1b (claro), mismos tokens que `src/styles/tokens.css`.

## 1. Objetivo
Permitir que un operador se autentique con correo + contraseña contra el backend y obtenga un JWT que
habilite el acceso al resto de la mesa de control. La pantalla replica fielmente el diseño "Acceso
Fibex Control" y funciona en tema oscuro (por defecto) y claro con los tokens existentes.

## 2. Criterios de aceptación

### Backend
- [ ] Prisma instalado y configurado contra PostgreSQL; `schema.prisma` con modelo `User`.
- [ ] Migración inicial aplicable (`prisma migrate dev --name init`) y `PrismaService` inyectable.
- [ ] `POST /auth/login` con credenciales válidas → `200` + `{ accessToken, user }`.
- [ ] Credenciales inválidas (email inexistente **o** password errónea) → `401` con el **mismo** mensaje
      genérico `Credenciales inválidas` (sin distinguir cuál falló).
- [ ] Body inválido (email no-email, password < 8) → `400` con detalle de validación.
- [ ] Contraseñas almacenadas con `bcrypt` (nunca en claro); `passwordHash` jamás se serializa.
- [ ] `GET /auth/me` protegido por `JwtAuthGuard`: sin token o token inválido/expirado → `401`;
      con token válido → `200` + el usuario.
- [ ] Swagger disponible en `/api/docs` documentando ambos endpoints (con `bearerAuth`).
- [ ] CORS habilitado para el origen del front (`http://localhost:5173`).
- [ ] Seed idempotente que crea un operador de prueba (`operador@fibex.com`).

### Frontend
- [ ] React Router: ruta `/login` renderiza `LoginPage`; `/` redirige a `/login` si no hay sesión y a
      `/dashboard` si la hay.
- [ ] La página reproduce el diseño: fondo con overlay en degradado, tarjeta centrada de 428px con
      `backdrop-blur`, badge "Acceso restringido", wordmark FIBEX / CONTROL, subtítulo, inputs con
      icono a la izquierda, botón primario con flecha, y footer de dos líneas.
- [ ] Solo se usan clases Tailwind mapeadas a tokens (`bg-surface`, `text-primary`, `border-default`,
      `bg-brand`, …). Cero hex hardcodeados en el JSX (test `tokens-only` existente debe seguir verde).
- [ ] Campos requeridos: email con formato válido y password ≥ 8 → si no, error inline y **no** se llama a la API.
- [ ] Al enviar: el botón muestra estado de carga y queda deshabilitado; no se permite doble submit.
- [ ] Login exitoso → token persistido y navegación a `/dashboard`.
- [ ] Login fallido (401) → banner de error accesible (`role="alert"`) con "Credenciales inválidas";
      el password se limpia y el foco vuelve al email.
- [ ] Error de red / 5xx → mensaje "No se pudo conectar con el servidor".
- [ ] Accesibilidad: cada input con `<label>` asociado, submit por `Enter`, foco visible con anillo `brand`.

## 3. Contratos (API / tipos)

```ts
// ---------- Prisma ----------
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(OPERADOR)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
enum Role { OPERADOR | SUPERVISOR | ADMIN }

// ---------- DTO / tipos compartidos ----------
type LoginRequest  = { email: string; password: string };           // email: IsEmail, password: MinLength(8)
type PublicUser    = { id: string; email: string; name: string; role: Role };
type LoginResponse = { accessToken: string; user: PublicUser };

// ---------- Endpoints ----------
// POST /auth/login   público   201→ NO: forzar 200 (@HttpCode(200))
//   body LoginRequest → LoginResponse
//   401 { statusCode:401, message:"Credenciales inválidas" }
//   400 { statusCode:400, message: string[] }
//
// GET /auth/me       Bearer JWT
//   → 200 PublicUser | 401
//
// JWT payload: { sub: user.id, email, role }   exp: 1h   secret: JWT_SECRET (env)
```

Front: `VITE_API_URL` (default `http://localhost:3000`). Token en `localStorage` bajo `fibex.token`
(store Zustand `useAuthStore` con `token`, `user`, `login()`, `logout()`); interceptor Axios adjunta
`Authorization: Bearer …`.

## 4. Casos borde y validaciones
- Usuario con `isActive: false` → `401` genérico (no revelar el estado de la cuenta).
- Email se normaliza a minúsculas y `trim` antes de buscar, tanto al crear como al autenticar.
- Timing: si el email no existe, igualmente se ejecuta un `bcrypt.compare` contra un hash dummy para
  no filtrar existencia por tiempo de respuesta.
- `JWT_SECRET` ausente al arrancar → la app falla en el boot (no arrancar con secreto por defecto).
- Token expirado o malformado → `401`; el front limpia la sesión y vuelve a `/login`.
- Doble click en "Acceder" → una sola petición.

## 5. Fuera de alcance
- Registro de usuarios, recuperación de contraseña, refresh tokens, "recordarme", 2FA.
- Autorización por rol (guards de rol) — solo autenticación.
- El `image-slot` de fondo del diseño: se implementa como fondo con degradado de tokens + hueco para
  imagen opcional vía prop; no se sube ninguna foto.
- La pantalla de `/dashboard` (ya existe `DashboardPage`); solo se enruta hacia ella.

## 6. Plan de tests (rojo primero)

**Back (Jest + supertest)**
1. `auth.service.spec.ts` — credenciales válidas devuelven token; password errónea lanza
   `UnauthorizedException`; email inexistente lanza el mismo error; usuario inactivo idem.
2. `auth.controller.spec.ts` / e2e `test/auth.e2e-spec.ts` — `POST /auth/login` 200/401/400;
   `GET /auth/me` 401 sin token y 200 con token; la respuesta nunca contiene `passwordHash`.

**Front (Vitest + RTL + user-event)**
1. `LoginPage.test.tsx` — renderiza labels/CTA/footer del diseño; validación inline sin llamar a la API;
   submit exitoso (mock de la capa API) navega a `/dashboard` y guarda el token; 401 muestra
   `role="alert"`; estado de carga deshabilita el botón; error de red muestra su mensaje.
2. Tests de los subcomponentes nuevos (`BrandWordmark`, `FieldWithIcon`) y del store `useAuthStore`.
3. `tokens-only.test.ts` existente debe cubrir los archivos nuevos (sin hex literales).

## 7. Estructura de componentes (front)

```
src/
  lib/api/client.ts            # instancia Axios + interceptor de token
  lib/api/auth.ts              # login(), me()  → tipados con los contratos
  stores/auth.store.ts         # Zustand + persistencia en localStorage
  routes/AppRouter.tsx         # createBrowserRouter, rutas públicas/privadas
  routes/ProtectedRoute.tsx
  components/ui/…              # (existente) Button, Input, Card, Badge
  features/auth/
    LoginPage.tsx              # composición de la página (layout + form)
    components/
      AuthLayout.tsx           # fondo + overlay + centrado de la tarjeta
      AuthCard.tsx             # tarjeta glass 428px
      BrandWordmark.tsx        # FIBEX / CONTROL
      RestrictedBadge.tsx      # chip "Acceso restringido"
      LoginForm.tsx            # form + validación + estados
      FieldWithIcon.tsx        # input con icono a la izquierda
      AuthFooter.tsx           # conexión encriptada + versión
    hooks/useLogin.ts          # React Query useMutation
```

## 8. Notas de homologación de stack
- **Back — instalar (🚦 requiere aprobación):** `prisma` (dev), `@prisma/client`, `@nestjs/config`,
  `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `@types/passport-jwt` (dev),
  `bcrypt` + `@types/bcrypt` (dev), `class-validator`, `class-transformer`, `@nestjs/swagger`.
- **Front — instalar (🚦 requiere aprobación):** `react-router-dom`, `axios`, `@tanstack/react-query`,
  `zustand`.
- **Base de datos (decidido):** **Docker Compose local**. Añadir `mesa-control-back/docker-compose.yml`
  con `postgres:16-alpine`, volumen nombrado, puerto `5432`, y `DATABASE_URL=postgresql://mesa:mesa@localhost:5432/mesa_control?schema=public`
  en `.env` (+ `.env.example` versionado; `.env` en `.gitignore`).
- **Dependencias: aprobadas** (2026-07-21) — instalar la lista completa de arriba, incluida React Query.
