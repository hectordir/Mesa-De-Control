import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { configureApp } from './../src/setup';

const PASSWORD = 'Fibex2026!';
const ID = 'g-1';

type LoginBody = { accessToken: string };
type ErrorBody = { statusCode: number; message: string | string[] };

interface GestionBody {
  id: string;
  codigo: string;
  fecha: string;
  operador: { id: string; nombre: string };
  tipo: string;
  motivo: string;
  observacion: string;
  requiereVisita: boolean;
  coordenadas: string | null;
  zona: string;
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

const USERS = [
  { id: 'u-admin', email: 'admin@fibex.com', name: 'Admin', role: 'ADMIN' },
  {
    id: 'u-super',
    email: 'super@fibex.com',
    name: 'Super',
    role: 'SUPERVISOR',
  },
  { id: 'u-op', email: 'operador@fibex.com', name: 'Opera', role: 'OPERADOR' },
  { id: 'op-2', email: 'op2@fibex.com', name: 'Andrea', role: 'OPERADOR' },
];

/** Fila persistida que devuelve `findUnique`/`update` (con la relación operador). */
const fila = (over: Record<string, unknown> = {}) => ({
  id: ID,
  operadorId: 'u-op',
  resultado: 'SOLUCIONADO_MESA',
  motivo: 'Corte de fibra',
  ubicacion: 'Caraballeda',
  fecha: new Date('2026-07-22T00:00:00.000Z'),
  createdAt: new Date('2026-07-22T10:42:00.000Z'),
  abonado: 'Cond. Los Robles',
  nombreCliente: 'María Pérez',
  telefono: '0412 555 1234',
  detalle: 'Sin Internet',
  solucion: 'Reinicio de ONU',
  tipo: 'Mesa',
  requiereVisita: false,
  observacion: 'Cliente notificado',
  coordenadas: '10.6012, -66.9311',
  updatedAt: null,
  updatedBy: null,
  operador: { id: 'u-op', name: 'Opera' },
  ...over,
});

describe('Gestion · edición (e2e)', () => {
  let app: INestApplication<App>;
  let gestionFindUnique: jest.Mock;
  let update: jest.Mock;
  const tokens: Record<string, string> = {};

  beforeAll(async () => {
    const hash = bcrypt.hashSync(PASSWORD, 4);
    const userFindUnique = jest.fn(
      (args: { where: { email?: string; id?: string } }) => {
        const { email, id } = args.where;
        const u = USERS.find((x) =>
          email !== undefined ? x.email === email : x.id === id,
        );
        return Promise.resolve(
          u ? { ...u, passwordHash: hash, isActive: true } : null,
        );
      },
    );

    gestionFindUnique = jest.fn((args: { where: { id: string } }) =>
      Promise.resolve(args.where.id === ID ? fila() : null),
    );
    update = jest.fn((args: { data: Record<string, unknown> }) =>
      Promise.resolve(fila(args.data)),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique: userFindUnique },
        gestion: { findUnique: gestionFindUnique, update },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    for (const u of USERS) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: u.email, password: PASSWORD });
      tokens[u.role === 'OPERADOR' ? u.id : u.role] = (
        res.body as LoginBody
      ).accessToken;
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    update.mockClear();
    gestionFindUnique.mockClear();
  });

  const patch = (id: string, token: string, body: unknown) =>
    request(app.getHttpServer())
      .patch(`/gestiones/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  const get = (id: string, token: string) =>
    request(app.getHttpServer())
      .get(`/gestiones/${id}`)
      .set('Authorization', `Bearer ${token}`);

  describe('GET /gestiones/:id', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get(`/gestiones/${ID}`).expect(401);
    });

    it('200 devuelve todos los campos que precargan el formulario', async () => {
      const res = await get(ID, tokens['u-op']).expect(200);
      const body = res.body as GestionBody;

      expect(body.id).toBe(ID);
      expect(body.codigo).toMatch(/^LG-\d{5}$/);
      expect(body.operador).toEqual({ id: 'u-op', nombre: 'Opera' });
      expect(body.fecha).toBe('2026-07-22');
      expect(body.tipo).toBe('Mesa');
      expect(body.motivo).toBe('Corte de fibra');
      expect(body.observacion).toBe('Cliente notificado');
      expect(body.requiereVisita).toBe(false);
      expect(body.coordenadas).toBe('10.6012, -66.9311');
      expect(body.zona).toBe('Caraballeda');
      expect(body.updatedAt).toBeNull();
      expect(body.updatedBy).toBeNull();
    });

    it('404 si el id no existe', async () => {
      await get('no-existe', tokens['u-op']).expect(404);
    });
  });

  describe('PATCH /gestiones/:id', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer())
        .patch(`/gestiones/${ID}`)
        .send({ motivo: 'Otro' })
        .expect(401);
    });

    it('200 para ADMIN: persiste el cambio y sella updatedAt/updatedBy', async () => {
      const res = await patch(ID, tokens.ADMIN, {
        motivo: 'Otro motivo',
      }).expect(200);

      const data = (
        update.mock.calls[0] as [{ data: Record<string, unknown> }]
      )[0].data;
      expect(data.motivo).toBe('Otro motivo');
      expect(data.updatedBy).toBe('u-admin');
      expect(data.updatedAt).toBeInstanceOf(Date);
      expect((res.body as GestionBody).id).toBe(ID);
    });

    it('200 para SUPERVISOR', async () => {
      await patch(ID, tokens.SUPERVISOR, { observacion: 'Revisado' }).expect(
        200,
      );
      const data = (
        update.mock.calls[0] as [{ data: Record<string, unknown> }]
      )[0].data;
      expect(data.updatedBy).toBe('u-super');
    });

    it('403 para OPERADOR', async () => {
      await patch(ID, tokens['u-op'], { motivo: 'Otro' }).expect(403);
      expect(update).not.toHaveBeenCalled();
    });

    it('404 si el id no existe', async () => {
      await patch('no-existe', tokens.ADMIN, { motivo: 'Otro' }).expect(404);
      expect(update).not.toHaveBeenCalled();
    });

    it('200 si observacion llega vacía: es opcional y se puede borrar', async () => {
      await patch(ID, tokens.ADMIN, { observacion: '' }).expect(200);
      const data = (
        update.mock.calls[0] as [{ data: Record<string, unknown> }]
      )[0].data;
      expect(data.observacion).toBe('');
    });

    it.each(['nombreCliente', 'telefono', 'motivo', 'zona'])(
      '400 si %p llega como cadena vacía',
      async (campo) => {
        const res = await patch(ID, tokens.ADMIN, { [campo]: '' }).expect(400);
        expect(Array.isArray((res.body as ErrorBody).message)).toBe(true);
        expect(update).not.toHaveBeenCalled();
      },
    );

    it('400 si operadorId apunta a un usuario que no es OPERADOR', async () => {
      await patch(ID, tokens.ADMIN, { operadorId: 'u-super' }).expect(400);
      expect(update).not.toHaveBeenCalled();
    });

    it('400 si operadorId no existe', async () => {
      await patch(ID, tokens.ADMIN, { operadorId: 'nadie' }).expect(400);
      expect(update).not.toHaveBeenCalled();
    });

    it('200 permite reasignar el operador a otro OPERADOR', async () => {
      await patch(ID, tokens.ADMIN, { operadorId: 'op-2' }).expect(200);
      const data = (
        update.mock.calls[0] as [{ data: Record<string, unknown> }]
      )[0].data;
      expect(data.operadorId).toBe('op-2');
    });

    it.each(['id', 'createdAt', 'updatedAt', 'updatedBy'])(
      '400: %p es inmutable y el body no lo admite',
      async (campo) => {
        await patch(ID, tokens.ADMIN, {
          motivo: 'Otro',
          [campo]: 'hackeado',
        }).expect(400);
        expect(update).not.toHaveBeenCalled();
      },
    );

    it('400 si resultado no es del enum', async () => {
      await patch(ID, tokens.ADMIN, { resultado: 'INVENTADO' }).expect(400);
      expect(update).not.toHaveBeenCalled();
    });

    it('400 con fecha mal formada', async () => {
      await patch(ID, tokens.ADMIN, { fecha: '22-07-2026' }).expect(400);
      expect(update).not.toHaveBeenCalled();
    });
  });
});
