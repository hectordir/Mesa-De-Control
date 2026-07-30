import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { configureApp } from './../src/setup';

describe('CORS (e2e)', () => {
  let app: INestApplication<App>;
  const corsOriginOriginal = process.env.CORS_ORIGIN;
  const previewsOriginal = process.env.CORS_ALLOW_VERCEL_PREVIEWS;

  beforeAll(async () => {
    process.env.CORS_ORIGIN =
      'https://mesa-de-control.vercel.app, http://localhost:5173';
    delete process.env.CORS_ALLOW_VERCEL_PREVIEWS;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.CORS_ORIGIN = corsOriginOriginal;
    if (previewsOriginal === undefined) {
      delete process.env.CORS_ALLOW_VERCEL_PREVIEWS;
    } else {
      process.env.CORS_ALLOW_VERCEL_PREVIEWS = previewsOriginal;
    }
  });

  it('refleja un origen permitido de la lista', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://mesa-de-control.vercel.app')
      .expect(200);

    expect(res.headers['access-control-allow-origin']).toBe(
      'https://mesa-de-control.vercel.app',
    );
  });

  it('no refleja un origen no permitido', async () => {
    const res = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', 'https://evil.com')
      .expect(200);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde sin cabecera CORS a peticiones sin Origin (healthcheck del balanceador)', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('acepta un preview de Vercel solo con CORS_ALLOW_VERCEL_PREVIEWS', async () => {
    const preview = 'https://mesa-de-control-git-feat-x.vercel.app';

    const sinFlag = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', preview)
      .expect(200);
    expect(sinFlag.headers['access-control-allow-origin']).toBeUndefined();

    process.env.CORS_ALLOW_VERCEL_PREVIEWS = 'true';
    const conFlag = await request(app.getHttpServer())
      .get('/health')
      .set('Origin', preview)
      .expect(200);
    delete process.env.CORS_ALLOW_VERCEL_PREVIEWS;

    expect(conFlag.headers['access-control-allow-origin']).toBe(preview);
  });
});
