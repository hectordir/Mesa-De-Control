import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { configureApp } from './../src/setup';

const PASSWORD = 'Fibex2026!';
const PERIODO = '2026-05';

type ErrorBody = { statusCode: number; message: string | string[] };
type LoginBody = { accessToken: string };

interface Analisis {
  periodo: string;
  kpis: Record<string, number>;
  serie: { mes: string; periodo: string; resueltas: number; resto: number }[];
  heatmap: { motivos: string[]; zonas: { zona: string; valores: number[] }[] };
}

const count = (n: number) => ({ _count: { _all: n } });
const dia = (fecha: string, resultado: string, n: number) => ({
  fecha: new Date(`${fecha}T00:00:00.000Z`),
  resultado,
  ...count(n),
});

/** Un mes con datos: 485 gestiones, 6 motivos y 2 zonas. */
const CON_DATOS = {
  porResultado: [
    { resultado: 'SOLUCIONADO_MESA', ...count(209) },
    { resultado: 'ENVIADO_SOPORTE2', ...count(180) },
    { resultado: 'ESCALADO_NOC', ...count(22) },
    { resultado: 'PENDIENTE_CLIENTE', ...count(50) },
    { resultado: 'REAGENDADO', ...count(24) },
  ],
  porDia: [
    dia('2026-02-03', 'SOLUCIONADO_MESA', 545),
    dia('2026-02-11', 'ESCALADO_NOC', 735),
    dia('2026-05-02', 'SOLUCIONADO_MESA', 209),
    dia('2026-05-09', 'ENVIADO_SOPORTE2', 276),
  ],
  porMotivo: [
    { motivo: 'Falla LOS', ...count(120) },
    { motivo: 'Internet Lento', ...count(95) },
    { motivo: 'Sin Internet', ...count(80) },
    { motivo: 'Usuario Clave GNT', ...count(60) },
    { motivo: 'Caídas Seguidas', ...count(45) },
    { motivo: 'No Navega', ...count(40) },
    { motivo: 'WiFi intermitente', ...count(30) },
  ],
  porZona: [
    { ubicacion: 'Macuto', motivo: 'Falla LOS', ...count(7) },
    { ubicacion: 'Macuto', motivo: 'No Navega', ...count(2) },
    { ubicacion: 'Canaima', motivo: 'Sin Internet', ...count(5) },
  ],
};

describe('Dashboard · análisis mensual (e2e)', () => {
  let app: INestApplication<App>;
  let groupBy: jest.Mock;
  let token: string;

  const conDatos = (fixture: Partial<typeof CON_DATOS> = {}) => {
    groupBy.mockImplementation((args: { by: string[]; take?: number }) => {
      const key = args.by.join('+');
      if (key === 'resultado')
        return Promise.resolve(fixture.porResultado ?? []);
      if (key === 'fecha+resultado')
        return Promise.resolve(fixture.porDia ?? []);
      if (key === 'motivo')
        return Promise.resolve((fixture.porMotivo ?? []).slice(0, args.take));
      if (key === 'ubicacion+motivo')
        return Promise.resolve(fixture.porZona ?? []);
      throw new Error(`groupBy inesperado: ${key}`);
    });
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
    groupBy = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue(user),
          findMany: jest.fn().mockResolvedValue([]),
        },
        gestion: { groupBy, findMany: jest.fn().mockResolvedValue([]) },
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

  const get = (query = '') =>
    request(app.getHttpServer())
      .get(`/dashboard/analisis-mensual${query}`)
      .set('Authorization', `Bearer ${token}`);

  it('401 sin token', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/analisis-mensual')
      .expect(401);
  });

  it('401 con token malformado', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/analisis-mensual')
      .set('Authorization', 'Bearer no.es.un.jwt')
      .expect(401);
  });

  it('200 con la forma exacta del contrato del front en un mes con datos', async () => {
    conDatos(CON_DATOS);

    const res = await get(`?periodo=${PERIODO}`).expect(200);
    const body = res.body as Analisis;

    expect(Object.keys(body).sort()).toEqual([
      'heatmap',
      'kpis',
      'periodo',
      'serie',
    ]);
    expect(body.periodo).toBe(PERIODO);
    expect(body.kpis).toEqual({
      volumen: 485,
      resueltos: 209,
      escalados: 22,
      metaEfectividad: 65,
    });
    expect(body.serie).toEqual([
      { mes: 'Febrero', periodo: '2026-02', resueltas: 545, resto: 735 },
      { mes: 'Marzo', periodo: '2026-03', resueltas: 0, resto: 0 },
      { mes: 'Abril', periodo: '2026-04', resueltas: 0, resto: 0 },
      { mes: 'Mayo', periodo: '2026-05', resueltas: 209, resto: 276 },
    ]);
    expect(body.heatmap.motivos).toEqual([
      'Falla LOS',
      'Internet Lento',
      'Sin Internet',
      'Usuario Clave GNT',
      'Caídas Seguidas',
      'No Navega',
    ]);
    expect(body.heatmap.zonas).toEqual([
      { zona: 'Canaima', valores: [0, 0, 5, 0, 0, 0] },
      { zona: 'Macuto', valores: [7, 0, 0, 0, 0, 2] },
    ]);
  });

  it('200 con estado vacío (no 404) en un mes sin gestiones', async () => {
    const res = await get(`?periodo=${PERIODO}`).expect(200);
    const body = res.body as Analisis;

    expect(body.kpis).toEqual({
      volumen: 0,
      resueltos: 0,
      escalados: 0,
      metaEfectividad: 65,
    });
    expect(body.heatmap).toEqual({ motivos: [], zonas: [] });
    expect(body.serie).toHaveLength(4);
    expect(body.serie.every((b) => b.resueltas === 0 && b.resto === 0)).toBe(
      true,
    );
  });

  it('200 sin `periodo`: usa el mes en curso', async () => {
    const res = await get().expect(200);
    const hoy = new Date();
    const esperado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

    expect((res.body as Analisis).periodo).toBe(esperado);
  });

  it.each(['2026-13', 'mayo', '2026-5', '2026-00', '2026', '2026-05-01', ''])(
    '400 con periodo=%p',
    async (periodo) => {
      const res = await get(`?periodo=${periodo}`).expect(400);
      const body = res.body as ErrorBody;
      expect(Array.isArray(body.message)).toBe(true);
      expect((body.message as string[]).join(' ')).toMatch(/periodo/i);
    },
  );

  it('400 con parámetros de query no permitidos', async () => {
    await get(`?periodo=${PERIODO}&empresa=fibex`).expect(400);
  });
});
