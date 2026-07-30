import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { configureApp } from './../src/setup';

const PASSWORD = 'Fibex2026!';

type LoginBody = { accessToken: string };

interface Resumen {
  actualizadoEn: string;
  kpis: {
    total: number;
    operativos: number;
    caidos: number;
    saludGrilla: number;
  };
  distribucionSeveridad: { severidad: string; total: number }[];
  fallas: Record<string, unknown>[];
}

const count = (n: number) => ({ _count: { _all: n } });

const caido = (
  id: string,
  nombre: string,
  categoria: string,
  tipoIncidencia: string,
  severidad: string,
  detectadoEn: string,
) => ({
  id,
  nombre,
  categoria,
  tipoIncidencia,
  severidad,
  detectadoEn: new Date(detectadoEn),
});

/** Grilla con 165 canales, 6 caídos (datos del spec). */
const CON_FALLAS = {
  total: 165,
  porSeveridad: [
    { severidad: 'CRITICA', ...count(2) },
    { severidad: 'ALTA', ...count(2) },
    { severidad: 'MEDIA', ...count(2) },
  ],
  fallas: [
    caido(
      'c1',
      'ESPN',
      'DEPORTES',
      'SIN_SENAL',
      'CRITICA',
      '2026-07-22T09:42:00.000Z',
    ),
    caido(
      'c2',
      'Cartoon Network',
      'INFANTIL',
      'SIN_SENAL',
      'CRITICA',
      '2026-07-22T10:07:00.000Z',
    ),
    caido(
      'c3',
      'Discovery',
      'DOCUMENTALES',
      'VIDEO_PIXELADO',
      'ALTA',
      '2026-07-22T10:18:00.000Z',
    ),
    caido(
      'c4',
      'CNN Español',
      'NOTICIAS',
      'IMAGEN_CONGELADA',
      'ALTA',
      '2026-07-22T10:26:00.000Z',
    ),
    caido(
      'c5',
      'HBO Max',
      'PREMIUM',
      'AUDIO_DESINCRONIZADO',
      'MEDIA',
      '2026-07-22T10:39:00.000Z',
    ),
    caido(
      'c6',
      'Fox Sports',
      'DEPORTES',
      'SENAL_INTERMITENTE',
      'MEDIA',
      '2026-07-22T10:51:00.000Z',
    ),
  ],
};

describe('Fibex Play · grilla en vivo (e2e)', () => {
  let app: INestApplication<App>;
  let canalCount: jest.Mock;
  let groupBy: jest.Mock;
  let findMany: jest.Mock;
  let token: string;

  const conDatos = (fixture: Partial<typeof CON_FALLAS> = {}) => {
    canalCount.mockResolvedValue(fixture.total ?? 0);
    groupBy.mockResolvedValue(fixture.porSeveridad ?? []);
    findMany.mockResolvedValue(fixture.fallas ?? []);
  };

  beforeAll(async () => {
    const user = {
      id: 'u-1',
      email: 'operador@fibex.com',
      passwordHash: bcrypt.hashSync(PASSWORD, 4),
      name: 'Operador Demo',
      role: 'OPERADOR',
      isActive: true,
    };
    canalCount = jest.fn();
    groupBy = jest.fn();
    findMany = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique: jest.fn().mockResolvedValue(user) },
        canal: { count: canalCount, groupBy, findMany },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: user.email, password: PASSWORD });
    token = (res.body as LoginBody).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => conDatos());

  const get = () =>
    request(app.getHttpServer())
      .get('/fibex-play')
      .set('Authorization', `Bearer ${token}`);

  it('401 sin token', async () => {
    await request(app.getHttpServer()).get('/fibex-play').expect(401);
  });

  it('401 con token malformado', async () => {
    await request(app.getHttpServer())
      .get('/fibex-play')
      .set('Authorization', 'Bearer no.es.un.jwt')
      .expect(401);
  });

  it('200 con la forma exacta del DTO cuando hay caídas', async () => {
    conDatos(CON_FALLAS);

    const res = await get().expect(200);
    const body = res.body as Resumen;

    expect(Object.keys(body).sort()).toEqual([
      'actualizadoEn',
      'distribucionSeveridad',
      'fallas',
      'kpis',
    ]);
    expect(new Date(body.actualizadoEn).toISOString()).toBe(body.actualizadoEn);
    expect(body.kpis).toEqual({
      total: 165,
      operativos: 159,
      caidos: 6,
      saludGrilla: 96,
    });
    expect(body.distribucionSeveridad).toEqual([
      { severidad: 'CRITICA', total: 2 },
      { severidad: 'ALTA', total: 2 },
      { severidad: 'MEDIA', total: 2 },
    ]);
    expect(body.fallas).toEqual([
      {
        id: 'c1',
        nombre: 'ESPN',
        categoria: 'DEPORTES',
        tipoIncidencia: 'SIN_SENAL',
        severidad: 'CRITICA',
        hora: '05:42',
        detectadoEn: '2026-07-22T09:42:00.000Z',
      },
      {
        id: 'c2',
        nombre: 'Cartoon Network',
        categoria: 'INFANTIL',
        tipoIncidencia: 'SIN_SENAL',
        severidad: 'CRITICA',
        hora: '06:07',
        detectadoEn: '2026-07-22T10:07:00.000Z',
      },
      {
        id: 'c3',
        nombre: 'Discovery',
        categoria: 'DOCUMENTALES',
        tipoIncidencia: 'VIDEO_PIXELADO',
        severidad: 'ALTA',
        hora: '06:18',
        detectadoEn: '2026-07-22T10:18:00.000Z',
      },
      {
        id: 'c4',
        nombre: 'CNN Español',
        categoria: 'NOTICIAS',
        tipoIncidencia: 'IMAGEN_CONGELADA',
        severidad: 'ALTA',
        hora: '06:26',
        detectadoEn: '2026-07-22T10:26:00.000Z',
      },
      {
        id: 'c5',
        nombre: 'HBO Max',
        categoria: 'PREMIUM',
        tipoIncidencia: 'AUDIO_DESINCRONIZADO',
        severidad: 'MEDIA',
        hora: '06:39',
        detectadoEn: '2026-07-22T10:39:00.000Z',
      },
      {
        id: 'c6',
        nombre: 'Fox Sports',
        categoria: 'DEPORTES',
        tipoIncidencia: 'SENAL_INTERMITENTE',
        severidad: 'MEDIA',
        hora: '06:51',
        detectadoEn: '2026-07-22T10:51:00.000Z',
      },
    ]);
  });

  it('200 con estado vacío (no 404) cuando no hay canales', async () => {
    const res = await get().expect(200);
    const body = res.body as Resumen;

    expect(body.kpis).toEqual({
      total: 0,
      operativos: 0,
      caidos: 0,
      saludGrilla: 100,
    });
    expect(body.distribucionSeveridad).toEqual([]);
    expect(body.fallas).toEqual([]);
  });
});
