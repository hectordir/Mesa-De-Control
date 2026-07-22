import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { configureApp } from './../src/setup';

const PASSWORD = 'Fibex2026!';

type ErrorBody = { statusCode: number; message: string | string[] };
type LoginBody = { accessToken: string };

interface GestionBody {
  id: string;
  fecha: string;
  operador: { id: string; nombre: string };
  zona: string;
  coordenadas: string | null;
  createdAt: string;
}

const USER = {
  id: 'u-1',
  email: 'operador@fibex.com',
  passwordHash: bcrypt.hashSync(PASSWORD, 4),
  name: 'Operador Demo',
  role: 'OPERADOR',
  isActive: true,
};

/** Body válido mínimo para el POST. */
const bodyValido = (over: Record<string, unknown> = {}) => ({
  fecha: '2026-07-22',
  abonado: 'Cond. Los Robles',
  telefono: '0412 555 1234',
  detalle: 'Sin Internet',
  solucion: 'Reinicio de ONU',
  resultado: 'SOLUCIONADO_MESA',
  tipo: 'Mesa',
  requiereVisita: false,
  zona: 'Caraballeda',
  motivo: 'Corte de fibra',
  observacion: 'Cliente notificado',
  coordenadas: '10.6012, -66.9311',
  ...over,
});

describe('Gestion · registro (e2e)', () => {
  let app: INestApplication<App>;
  let create: jest.Mock;
  let token: string;

  beforeAll(async () => {
    // `create` refleja los datos recibidos, imitando la fila persistida.
    create = jest.fn((args: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'g-1',
        createdAt: new Date('2026-07-22T10:42:00.000Z'),
        operador: { id: args.data.operadorId, name: USER.name },
        ...args.data,
      }),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique: jest.fn().mockResolvedValue(USER) },
        gestion: { create },
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

  beforeEach(() => create.mockClear());

  const post = (body: unknown) =>
    request(app.getHttpServer())
      .post('/gestiones')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('401 sin token', async () => {
    await request(app.getHttpServer())
      .post('/gestiones')
      .send(bodyValido())
      .expect(401);
  });

  it('201 con body válido: persiste con el operadorId del token', async () => {
    const res = await post(bodyValido()).expect(201);
    const body = res.body as GestionBody;

    expect(create).toHaveBeenCalledTimes(1);
    const args = create.mock.calls[0] as [{ data: Record<string, unknown> }];
    const data = args[0].data;
    expect(data.operadorId).toBe(USER.id);
    expect(data.ubicacion).toBe('Caraballeda');

    expect(body.id).toBe('g-1');
    expect(body.operador).toEqual({ id: USER.id, nombre: USER.name });
    expect(body.zona).toBe('Caraballeda');
    expect(body.fecha).toBe('2026-07-22');
    expect(body.coordenadas).toBe('10.6012, -66.9311');
  });

  it('ignora el operadorId del body: usa el del token', async () => {
    await post(bodyValido({ operadorId: 'hacker-999' })).expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('201 sin coordenadas: coordenadas viaja como null', async () => {
    const res = await post(bodyValido({ coordenadas: undefined })).expect(201);
    expect((res.body as GestionBody).coordenadas).toBeNull();
  });

  it.each([
    'abonado',
    'telefono',
    'detalle',
    'solucion',
    'zona',
    'motivo',
    'observacion',
  ])('400 si falta el obligatorio %p', async (campo) => {
    const body = bodyValido();
    delete (body as Record<string, unknown>)[campo];
    const res = await post(body).expect(400);
    expect(Array.isArray((res.body as ErrorBody).message)).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it('400 si resultado no es del enum', async () => {
    await post(bodyValido({ resultado: 'INVENTADO' })).expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it.each(['22-07-2026', '2026-7-2', 'hoy', ''])(
    '400 con fecha=%p',
    async (fecha) => {
      await post(bodyValido({ fecha })).expect(400);
    },
  );
});
