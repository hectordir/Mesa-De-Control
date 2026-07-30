import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { configureApp } from './../src/setup';

/** Crea la app con `configureApp` bajo un NODE_ENV concreto. */
async function crearApp(nodeEnv: string): Promise<INestApplication<App>> {
  process.env.NODE_ENV = nodeEnv;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({})
    .compile();

  const app = moduleFixture.createNestApplication<INestApplication<App>>();
  configureApp(app);
  await app.init();
  return app;
}

describe('Swagger (e2e)', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;
  let app: INestApplication<App>;

  afterEach(async () => {
    await app.close();
    process.env.NODE_ENV = nodeEnvOriginal;
  });

  it('sirve /api/docs fuera de producción', async () => {
    app = await crearApp('test');

    await request(app.getHttpServer()).get('/api/docs').expect(200);
  });

  it('devuelve 404 en /api/docs con NODE_ENV=production', async () => {
    app = await crearApp('production');

    await request(app.getHttpServer()).get('/api/docs').expect(404);
  });
});
