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
  nombreCliente: string;
  observacion: string;
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

/** Otro operador válido: la autoría del body puede diferir del usuario del token. */
const OTRO_OPERADOR = {
  id: 'op-2',
  email: 'andrea.perez@fibex.com',
  name: 'Andrea Pérez',
  role: 'OPERADOR',
  isActive: true,
};

/** No-operador: elegirlo como autoría debe rechazarse. */
const SUPERVISOR = {
  id: 'sup-1',
  email: 'super@fibex.com',
  name: 'Supervisora',
  role: 'SUPERVISOR',
  isActive: true,
};

const USUARIOS = [USER, OTRO_OPERADOR, SUPERVISOR];

/** Resuelve por email (login/jwt) o por id (validación de operadorId). */
const findUnique = jest.fn(
  (args: { where: { email?: string; id?: string } }) => {
    const { email, id } = args.where;
    const found = USUARIOS.find((u) =>
      email !== undefined ? u.email === email : u.id === id,
    );
    return Promise.resolve(found ?? null);
  },
);

/** Body válido mínimo para el POST. `operadorId` (§9.1) es requerido. */
const bodyValido = (over: Record<string, unknown> = {}) => ({
  operadorId: USER.id,
  fecha: '2026-07-22',
  abonado: 'Cond. Los Robles',
  nombreCliente: 'María Pérez',
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
        user: { findUnique },
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

  it('201 con body válido: persiste con el operadorId del body', async () => {
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

  it('201: la autoría es el operadorId del body, no el usuario del token', async () => {
    const res = await post(bodyValido({ operadorId: OTRO_OPERADOR.id })).expect(
      201,
    );
    const data = (
      create.mock.calls[0] as [{ data: Record<string, unknown> }]
    )[0].data;
    expect(data.operadorId).toBe(OTRO_OPERADOR.id);
    expect((res.body as GestionBody).operador.id).toBe(OTRO_OPERADOR.id);
  });

  it('400 si operadorId no existe', async () => {
    await post(bodyValido({ operadorId: 'no-existe-999' })).expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('400 si operadorId es de un usuario que no es OPERADOR', async () => {
    await post(bodyValido({ operadorId: SUPERVISOR.id })).expect(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('201 sin coordenadas: coordenadas viaja como null', async () => {
    const res = await post(bodyValido({ coordenadas: undefined })).expect(201);
    expect((res.body as GestionBody).coordenadas).toBeNull();
  });

  it.each([
    'operadorId',
    'abonado',
    'nombreCliente',
    'telefono',
    'detalle',
    'solucion',
    'zona',
    'motivo',
  ])('400 si falta el obligatorio %p', async (campo) => {
    const body = bodyValido();
    delete (body as Record<string, unknown>)[campo];
    const res = await post(body).expect(400);
    expect(Array.isArray((res.body as ErrorBody).message)).toBe(true);
    expect(create).not.toHaveBeenCalled();
  });

  it('201 con nombreCliente: se persiste y vuelve en el body', async () => {
    const res = await post(
      bodyValido({ nombreCliente: 'Ana Quintero' }),
    ).expect(201);
    const data = (
      create.mock.calls[0] as [{ data: Record<string, unknown> }]
    )[0].data;
    expect(data.nombreCliente).toBe('Ana Quintero');
    expect((res.body as GestionBody).nombreCliente).toBe('Ana Quintero');
  });

  it.each(['nombreCliente', 'telefono'])(
    '400 si %p llega como cadena vacía',
    async (campo) => {
      const res = await post(bodyValido({ [campo]: '' })).expect(400);
      expect(Array.isArray((res.body as ErrorBody).message)).toBe(true);
      expect(create).not.toHaveBeenCalled();
    },
  );

  // `observacion` es opcional (spec `abonado-fibex-y-datos-demo`): el default
  // '' de Prisma cubre su ausencia, no puede devolver 400.
  it('201 sin observacion: se persiste como cadena vacía', async () => {
    const body = bodyValido();
    delete (body as Record<string, unknown>).observacion;
    const res = await post(body).expect(201);
    const data = (
      create.mock.calls[0] as [{ data: Record<string, unknown> }]
    )[0].data;
    expect(data.observacion).toBe('');
    expect((res.body as GestionBody).observacion).toBe('');
  });

  it('201 con observacion vacía: no es un obligatorio', async () => {
    await post(bodyValido({ observacion: '' })).expect(201);
    expect(create).toHaveBeenCalled();
  });

  it('400 si nombreCliente supera 120 caracteres', async () => {
    await post(bodyValido({ nombreCliente: 'x'.repeat(121) })).expect(400);
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
