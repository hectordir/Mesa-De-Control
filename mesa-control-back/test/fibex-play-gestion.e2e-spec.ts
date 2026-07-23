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
type ErrorBody = { statusCode: number; message: string | string[] };

interface Resumen {
  kpis: Record<string, number>;
  topCanales: { canal: string; total: number }[];
  origen: { origen: string; total: number }[];
  registros: Record<string, unknown>[];
  catalogos: Record<string, string[]>;
}

const count = (n: number) => ({ _count: { _all: n } });

const bodyValido = {
  operadorId: 'op-1',
  abonado: 'Cond. Los Robles',
  canal: 'ESPN',
  motivo: 'Sin señal',
  solucion: 'Reinicio de ONU',
  estado: 'SOLUCIONADO',
};

describe('Fibex Play · Gestión de Clientes (e2e)', () => {
  let app: INestApplication<App>;
  let atCount: jest.Mock;
  let groupBy: jest.Mock;
  let findMany: jest.Mock;
  let create: jest.Mock;
  let token: string;

  beforeAll(async () => {
    const user = {
      id: 'u-1',
      email: 'operador@fibex.com',
      passwordHash: bcrypt.hashSync(PASSWORD, 4),
      name: 'Operador Demo',
      role: 'OPERADOR',
      isActive: true,
    };

    atCount = jest.fn().mockResolvedValue(24);
    groupBy = jest.fn((args: { by: string[] }) => {
      const key = args.by.join('+');
      if (key === 'estado')
        return Promise.resolve([
          { estado: 'SOLUCIONADO', ...count(16) },
          { estado: 'EN_PROCESO', ...count(5) },
          { estado: 'ESCALADO', ...count(3) },
        ]);
      if (key === 'canal')
        return Promise.resolve([{ canal: 'ESPN', ...count(6) }]);
      if (key === 'motivo')
        return Promise.resolve([{ motivo: 'Sin señal', ...count(10) }]);
      throw new Error(`groupBy inesperado: ${key}`);
    });
    findMany = jest.fn().mockResolvedValue([
      {
        id: 'a-1',
        abonado: 'Cond. Los Robles',
        canal: 'ESPN',
        motivo: 'Sin señal',
        solucion: 'Reinicio de ONU',
        estado: 'SOLUCIONADO',
        creadoEn: new Date('2026-07-22T14:12:00.000Z'),
        operador: { name: 'Jhon Rivas' },
      },
    ]);
    create = jest.fn((args: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'nuevo-1',
        abonado: args.data.abonado,
        canal: args.data.canal,
        motivo: args.data.motivo,
        solucion: args.data.solucion,
        estado: args.data.estado,
        creadoEn: new Date('2026-07-22T15:00:00.000Z'),
        operador: { name: 'Jhon Rivas' },
      }),
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest
            .fn()
            .mockImplementation(
              ({ where }: { where: { id?: string; email?: string } }) => {
                // Login + JwtStrategy resuelven al usuario autenticado (por email o su id).
                if (where.email === user.email || where.id === user.id)
                  return Promise.resolve(user);
                // Validación de autoría en POST: op-1 existe, cualquier otro no.
                if (where.id === 'op-1')
                  return Promise.resolve({ id: 'op-1', role: 'OPERADOR' });
                return Promise.resolve(null);
              },
            ),
        },
        atencionApp: { count: atCount, groupBy, findMany, create },
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

  const auth = () => `Bearer ${token}`;

  describe('GET /fibex-play/gestion', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/fibex-play/gestion').expect(401);
    });

    it('200 con la forma exacta del DTO', async () => {
      const res = await request(app.getHttpServer())
        .get('/fibex-play/gestion')
        .set('Authorization', auth())
        .expect(200);
      const body = res.body as Resumen;

      expect(Object.keys(body).sort()).toEqual([
        'catalogos',
        'kpis',
        'origen',
        'registros',
        'topCanales',
      ]);
      expect(body.kpis).toEqual({
        totalAtendidos: 24,
        solucionados: 16,
        enProceso: 5,
        escalados: 3,
      });
      expect(body.topCanales).toEqual([{ canal: 'ESPN', total: 6 }]);
      expect(body.origen).toEqual([
        { origen: 'Señal / Transmisión', total: 10 },
      ]);
      expect(body.registros[0]).toMatchObject({
        id: 'a-1',
        operador: 'Jhon Rivas',
        canal: 'ESPN',
        creadoEn: '2026-07-22T14:12:00.000Z',
      });
      expect(body.catalogos.canales).toHaveLength(10);
      expect(body.catalogos.estados).toEqual([
        'SOLUCIONADO',
        'EN_PROCESO',
        'ESCALADO',
      ]);
    });
  });

  describe('POST /fibex-play/gestion', () => {
    it('401 sin token', async () => {
      await request(app.getHttpServer())
        .post('/fibex-play/gestion')
        .send(bodyValido)
        .expect(401);
    });

    it('400 con canal fuera de catálogo', async () => {
      const res = await request(app.getHttpServer())
        .post('/fibex-play/gestion')
        .set('Authorization', auth())
        .send({ ...bodyValido, canal: 'Canal Inexistente' })
        .expect(400);
      expect((res.body as ErrorBody).message.toString()).toMatch(/canal/i);
    });

    it('400 con estado inválido', async () => {
      await request(app.getHttpServer())
        .post('/fibex-play/gestion')
        .set('Authorization', auth())
        .send({ ...bodyValido, estado: 'CERRADO' })
        .expect(400);
    });

    it('400 sin abonado', async () => {
      const { abonado, ...sinAbonado } = bodyValido;
      void abonado;
      await request(app.getHttpServer())
        .post('/fibex-play/gestion')
        .set('Authorization', auth())
        .send(sinAbonado)
        .expect(400);
    });

    it('201 con body válido devuelve el registro', async () => {
      const res = await request(app.getHttpServer())
        .post('/fibex-play/gestion')
        .set('Authorization', auth())
        .send(bodyValido)
        .expect(201);
      expect(res.body).toEqual({
        id: 'nuevo-1',
        operador: 'Jhon Rivas',
        abonado: 'Cond. Los Robles',
        canal: 'ESPN',
        motivo: 'Sin señal',
        solucion: 'Reinicio de ONU',
        estado: 'SOLUCIONADO',
        creadoEn: '2026-07-22T15:00:00.000Z',
      });
    });
  });
});
