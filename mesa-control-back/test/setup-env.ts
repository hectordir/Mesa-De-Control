// Se ejecuta antes de cargar los módulos de la app: garantiza que los e2e corran
// sin depender de un .env local ni de una base de datos real.
process.env.JWT_SECRET ??= 'e2e-test-secret';
process.env.JWT_EXPIRES_IN ??= '1h';
process.env.DATABASE_URL ??=
  'postgresql://mesa:mesa@localhost:5432/mesa_control?schema=public';
