import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Origen permitido en desarrollo cuando `CORS_ORIGIN` no está definido. */
const ORIGEN_DEV = 'http://localhost:5173';

/** Preview deploys de Vercel: `https://<lo-que-sea>.vercel.app` (solo https). */
const PREVIEW_VERCEL = /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)*\.vercel\.app$/i;

/** Subconjunto de variables de entorno que gobiernan CORS. */
export interface CorsEnv {
  CORS_ORIGIN?: string;
  CORS_ALLOW_VERCEL_PREVIEWS?: string;
}

/** `CORS_ORIGIN` admite lista separada por comas; se normalizan espacios y vacíos. */
export function parseCorsOrigins(valor: string | undefined): string[] {
  const origenes = (valor ?? ORIGEN_DEV)
    .split(',')
    .map((origen) => origen.trim())
    .filter((origen) => origen.length > 0);

  return origenes.length > 0 ? origenes : [ORIGEN_DEV];
}

/**
 * Decide si un `Origin` puede hablar con la API.
 * - Sin header `Origin` (curl, healthcheck del balanceador) → permitido.
 * - Coincidencia exacta con la lista de `CORS_ORIGIN`.
 * - Previews `*.vercel.app` solo si `CORS_ALLOW_VERCEL_PREVIEWS` está activo (default cerrado).
 */
export function isOriginAllowed(
  origin: string | undefined,
  env: CorsEnv = process.env,
): boolean {
  if (!origin) return true;

  if (parseCorsOrigins(env.CORS_ORIGIN).includes(origin)) return true;

  const previewsActivos = env.CORS_ALLOW_VERCEL_PREVIEWS === 'true';
  return previewsActivos && PREVIEW_VERCEL.test(origin);
}

/** Swagger queda cerrado en producción; en cualquier otro entorno (incluido `test`) se monta. */
export function isSwaggerEnabled(
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  return nodeEnv !== 'production';
}

/** Configuración compartida entre el bootstrap real (main.ts) y los tests e2e. */
export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => callback(null, isOriginAllowed(origin)),
    credentials: true,
  });

  if (isSwaggerEnabled()) {
    const config = new DocumentBuilder()
      .setTitle('Mesa de Control API')
      .setDescription('API de la mesa de control (clon de Fibex Control)')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'bearerAuth',
      )
      .build();

    SwaggerModule.setup(
      'api/docs',
      app,
      SwaggerModule.createDocument(app, config),
    );
  }

  return app;
}
