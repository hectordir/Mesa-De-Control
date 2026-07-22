import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { configureApp } from './../src/setup';

const PASSWORD = 'Fibex2026!';
const FECHA = '2026-07-22';

type ErrorBody = { statusCode: number; message: string | string[] };
type LoginBody = { accessToken: string };

interface Resumen {
  fecha: string;
  kpis: Record<string, number>;
  operadores: Record<string, unknown>[];
  distribucion: { resultado: string; total: number }[];
  topAverias: { motivo: string; total: number }[];
  actividad: Record<string, unknown>[];
}

const count = (n: number) => ({ _count: { _all: n } });

/** Un día con datos: 342 gestiones repartidas entre dos operadores. */
const CON_DATOS = {
  porResultado: [
    { resultado: 'SOLUCIONADO_MESA', ...count(198) },
    { resultado: 'ENVIADO_SOPORTE2', ...count(54) },
    { resultado: 'ESCALADO_NOC', ...count(31) },
    { resultado: 'PENDIENTE_CLIENTE', ...count(38) },
    { resultado: 'REAGENDADO', ...count(21) },
  ],
  porOperador: [
    { operadorId: 'op-1', resultado: 'SOLUCIONADO_MESA', ...count(120) },
    { operadorId: 'op-1', resultado: 'ENVIADO_SOPORTE2', ...count(30) },
    { operadorId: 'op-1', resultado: 'ESCALADO_NOC', ...count(20) },
    { operadorId: 'op-2', resultado: 'SOLUCIONADO_MESA', ...count(78) },
    { operadorId: 'op-2', resultado: 'ENVIADO_SOPORTE2', ...count(24) },
    { operadorId: 'op-2', resultado: 'ESCALADO_NOC', ...count(11) },
    { operadorId: 'op-2', resultado: 'PENDIENTE_CLIENTE', ...count(38) },
    { operadorId: 'op-2', resultado: 'REAGENDADO', ...count(21) },
  ],
  porMotivo: [
    { motivo: 'Corte de fibra (FTTH)', ...count(84) },
    { motivo: 'Sin señal / ONT', ...count(61) },
    { motivo: 'Lentitud de navegación', ...count(47) },
    { motivo: 'Falla en IPTV', ...count(33) },
    { motivo: 'WiFi intermitente', ...count(28) },
  ],
  actividad: [
    {
      id: 'g-1',
      resultado: 'SOLUCIONADO_MESA',
      ubicacion: 'Cond. Los Robles',
      createdAt: new Date('2026-07-22T10:42:00.000Z'),
      operador: { name: 'Jhon Rivas' },
    },
  ],
  usuarios: [
    { id: 'op-1', name: 'Jhon Rivas' },
    { id: 'op-2', name: 'María León' },
  ],
};

describe('Dashboard · monitor diario (e2e)', () => {
  let app: INestApplication<App>;
  let groupBy: jest.Mock;
  let gestionFindMany: jest.Mock;
  let userFindMany: jest.Mock;
  let token: string;

  /** Alimenta los mocks de Prisma con un día concreto (vacío por defecto). */
  const conDatos = (fixture: Partial<typeof CON_DATOS> = {}) => {
    groupBy.mockImplementation((args: { by: string[]; take?: number }) => {
      const key = args.by.join('+');
      if (key === 'resultado')
        return Promise.resolve(fixture.porResultado ?? []);
      if (key === 'operadorId+resultado')
        return Promise.resolve(fixture.porOperador ?? []);
      if (key === 'motivo')
        return Promise.resolve((fixture.porMotivo ?? []).slice(0, args.take));
      throw new Error(`groupBy inesperado: ${key}`);
    });
    gestionFindMany.mockResolvedValue(fixture.actividad ?? []);
    userFindMany.mockResolvedValue(fixture.usuarios ?? []);
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
    gestionFindMany = jest.fn();
    userFindMany = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue(user),
          findMany: userFindMany,
        },
        gestion: { groupBy, findMany: gestionFindMany },
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
      .get(`/dashboard/monitor-diario${query}`)
      .set('Authorization', `Bearer ${token}`);

  it('401 sin token', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/monitor-diario')
      .expect(401);
  });

  it('401 con token malformado', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/monitor-diario')
      .set('Authorization', 'Bearer no.es.un.jwt')
      .expect(401);
  });

  it('200 con la forma exacta del DTO en un día con datos', async () => {
    conDatos(CON_DATOS);

    const res = await get(`?fecha=${FECHA}`).expect(200);
    const body = res.body as Resumen;

    expect(Object.keys(body).sort()).toEqual([
      'actividad',
      'distribucion',
      'fecha',
      'kpis',
      'operadores',
      'topAverias',
    ]);
    expect(body.fecha).toBe(FECHA);
    expect(body.kpis).toEqual({
      clientesAtendidos: 342,
      efectividadMesa: 58,
      enviadoSoporte2: 54,
      escaladoNoc: 31,
      pendienteCliente: 38,
    });
    expect(body.operadores).toEqual([
      {
        id: 'op-2',
        nombre: 'María León',
        clientes: 172,
        mesa: 78,
        soporte2: 24,
        noc: 11,
      },
      {
        id: 'op-1',
        nombre: 'Jhon Rivas',
        clientes: 170,
        mesa: 120,
        soporte2: 30,
        noc: 20,
      },
    ]);
    expect(body.distribucion).toEqual([
      { resultado: 'SOLUCIONADO_MESA', total: 198 },
      { resultado: 'ENVIADO_SOPORTE2', total: 54 },
      { resultado: 'ESCALADO_NOC', total: 31 },
      { resultado: 'PENDIENTE_CLIENTE', total: 38 },
      { resultado: 'REAGENDADO', total: 21 },
    ]);
    expect(body.topAverias).toEqual([
      { motivo: 'Corte de fibra (FTTH)', total: 84 },
      { motivo: 'Sin señal / ONT', total: 61 },
      { motivo: 'Lentitud de navegación', total: 47 },
      { motivo: 'Falla en IPTV', total: 33 },
      { motivo: 'WiFi intermitente', total: 28 },
    ]);
    expect(body.actividad).toEqual([
      {
        id: 'g-1',
        operador: 'Jhon Rivas',
        resultado: 'SOLUCIONADO_MESA',
        ubicacion: 'Cond. Los Robles',
        hora: '2026-07-22T10:42:00.000Z',
      },
    ]);
  });

  it('200 con estado vacío (no 404) en un día sin gestiones', async () => {
    const res = await get(`?fecha=${FECHA}`).expect(200);
    const body = res.body as Resumen;

    expect(body.kpis).toEqual({
      clientesAtendidos: 0,
      efectividadMesa: 0,
      enviadoSoporte2: 0,
      escaladoNoc: 0,
      pendienteCliente: 0,
    });
    expect(body.operadores).toEqual([]);
    expect(body.topAverias).toEqual([]);
    expect(body.actividad).toEqual([]);
    expect(body.distribucion).toEqual([
      { resultado: 'SOLUCIONADO_MESA', total: 0 },
      { resultado: 'ENVIADO_SOPORTE2', total: 0 },
      { resultado: 'ESCALADO_NOC', total: 0 },
      { resultado: 'PENDIENTE_CLIENTE', total: 0 },
      { resultado: 'REAGENDADO', total: 0 },
    ]);
  });

  it('200 sin `fecha`: usa el día de hoy', async () => {
    const res = await get().expect(200);
    const hoy = new Date();
    const esperado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    expect((res.body as Resumen).fecha).toBe(esperado);
  });

  it.each(['cualquier-cosa', '22-07-2026', '2026-7-2', '2026-13-45', ''])(
    '400 con fecha=%p',
    async (fecha) => {
      const res = await get(`?fecha=${fecha}`).expect(400);
      const body = res.body as ErrorBody;
      expect(Array.isArray(body.message)).toBe(true);
      expect((body.message as string[]).join(' ')).toMatch(/fecha/i);
    },
  );

  it('400 con parámetros de query no permitidos', async () => {
    await get(`?fecha=${FECHA}&empresa=fibex`).expect(400);
  });
});
