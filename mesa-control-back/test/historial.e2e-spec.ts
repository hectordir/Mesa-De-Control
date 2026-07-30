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

interface ListBody {
  items: Array<{
    id: string;
    codigo: string;
    operador: { id: string; nombre: string; iniciales: string };
    abonado: string;
    nombreCliente: string;
    telefono: string;
    zona: string;
    canal: string | null;
    resultado: string;
    fecha: string;
    hora: string;
    duracionMin: number | null;
    modificadaFecha: string | null;
    modificadaHora: string | null;
    editor: { id: string; nombre: string } | null;
  }>;
  total: number;
  page: number;
  pageSize: number;
  counts: { total: number; porResultado: Record<string, number> };
}

const USER = {
  id: 'u-1',
  email: 'operador@fibex.com',
  passwordHash: bcrypt.hashSync(PASSWORD, 4),
  name: 'Operador Demo',
  role: 'OPERADOR',
  isActive: true,
};

const findUnique = jest.fn((args: { where: { email?: string; id?: string } }) =>
  Promise.resolve(
    args.where.email === USER.email || args.where.id === USER.id ? USER : null,
  ),
);

/** Total del conjunto simulado; findMany devuelve [] si la página se pasa. */
const TOTAL = 25;

const fila = () => ({
  id: 'g-1',
  resultado: 'SOLUCIONADO_MESA',
  ubicacion: 'Norte',
  fecha: new Date('2026-07-17T00:00:00.000Z'),
  createdAt: new Date('2026-07-17T14:42:00.000Z'),
  abonado: 'Cond. Los Robles',
  nombreCliente: 'María Pérez',
  telefono: '0412-118-4420',
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  canal: 'TELEGRAM',
  duracion: 12,
  operador: { id: 'op-1', name: 'Jhon Rivas' },
  updatedAt: new Date('2026-07-18T11:47:00.000Z'),
  editor: { id: 'u-9', name: 'Ana Suárez' },
});

const findMany = jest.fn((args: { skip: number }) =>
  Promise.resolve(args.skip >= TOTAL ? [] : [fila()]),
);
const count = jest.fn().mockResolvedValue(TOTAL);
const groupBy = jest.fn().mockResolvedValue([
  { resultado: 'SOLUCIONADO_MESA', _count: { _all: 20 } },
  { resultado: 'ESCALADO_NOC', _count: { _all: 5 } },
]);

describe('Historial · GET /gestiones (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique },
        gestion: { findMany, count, groupBy },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: USER.email, password: PASSWORD });
    token = (res.body as LoginBody).accessToken;
  });

  afterAll(async () => {
    await app?.close();
  });

  const get = (qs = '') =>
    request(app.getHttpServer())
      .get(`/gestiones${qs}`)
      .set('Authorization', `Bearer ${token}`);

  it('401 sin token', async () => {
    await request(app.getHttpServer()).get('/gestiones').expect(401);
  });

  it('200: devuelve el DTO del Historial con defaults y counts de los 5 resultados', async () => {
    const res = await get().expect(200);
    const body = res.body as ListBody;

    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(10);
    expect(body.total).toBe(TOTAL);
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items[0]).toMatchObject({
      id: 'g-1',
      operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
      abonado: 'Cond. Los Robles',
      nombreCliente: 'María Pérez',
      telefono: '0412-118-4420',
      zona: 'Norte',
      canal: 'TELEGRAM',
      resultado: 'SOLUCIONADO_MESA',
      // `fecha` es `@db.Date`: día calendario puro, no se convierte de zona.
      fecha: '2026-07-17',
      // `createdAt` 14:42 UTC = 10:42 en Caracas.
      hora: '10:42',
      duracionMin: 12,
      // `updatedAt` 11:47 UTC = 7:47 a. m. en Caracas (mismo día).
      modificadaFecha: '18/07/2026',
      modificadaHora: '7:47 a. m.',
      editor: { id: 'u-9', nombre: 'Ana Suárez' },
    });
    expect(body.items[0].codigo).toMatch(/^LG-\d{5}$/);

    expect(body.counts.total).toBe(TOTAL);
    expect(Object.keys(body.counts.porResultado).sort()).toEqual([
      'ENVIADO_SOPORTE2',
      'ESCALADO_NOC',
      'PENDIENTE_CLIENTE',
      'REAGENDADO',
      'SOLUCIONADO_MESA',
    ]);
    expect(body.counts.porResultado.SOLUCIONADO_MESA).toBe(20);
    expect(body.counts.porResultado.ENVIADO_SOPORTE2).toBe(0);
  });

  it('page fuera de rango: items vacío pero total correcto', async () => {
    const res = await get('?page=99&pageSize=10').expect(200);
    const body = res.body as ListBody;

    expect(body.items).toEqual([]);
    expect(body.total).toBe(TOTAL);
    expect(body.page).toBe(99);
  });

  it('400 con sortKey inválido', async () => {
    await get('?sortKey=inventado').expect(400);
  });

  it('200 con sortKey=nombreCliente: ordena por nombreCliente en Postgres', async () => {
    findMany.mockClear();
    await get('?sortKey=nombreCliente&sortDir=asc').expect(200);
    const args = (findMany.mock.calls[0] as [Record<string, unknown>])[0];
    expect(args.orderBy).toEqual([{ nombreCliente: 'asc' }, { id: 'asc' }]);
  });

  it('search también busca por nombre de cliente', async () => {
    findMany.mockClear();
    await get('?search=maria').expect(200);
    const args = (findMany.mock.calls[0] as [Record<string, unknown>])[0];
    expect((args.where as { OR: unknown[] }).OR).toContainEqual({
      nombreCliente: { contains: 'maria', mode: 'insensitive' },
    });
  });
});
