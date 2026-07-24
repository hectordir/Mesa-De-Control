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
const efectiva = new Date(`${FECHA}T00:00:00.000Z`);
const count = (n: number) => ({ _count: { _all: n } });

type LoginBody = { accessToken: string };

const USERS: Record<string, { id: string; role: string }> = {
  'admin@fibex.com': { id: 'u-admin', role: 'ADMIN' },
  'super@fibex.com': { id: 'u-super', role: 'SUPERVISOR' },
  'operador@fibex.com': { id: 'u-op', role: 'OPERADOR' },
};
const byId = Object.fromEntries(
  Object.entries(USERS).map(([email, u]) => [u.id, { email, ...u }]),
);

describe('Supervisión (e2e)', () => {
  let app: INestApplication<App>;
  let deleteMany: jest.Mock;
  const tokens: Record<string, string> = {};

  beforeAll(async () => {
    const hash = bcrypt.hashSync(PASSWORD, 4);
    const findUnique = jest.fn(
      (args: { where: { email?: string; id?: string } }) => {
        const u = args.where.email
          ? { email: args.where.email, ...USERS[args.where.email] }
          : byId[args.where.id!];
        if (!u) return Promise.resolve(null);
        return Promise.resolve({
          id: u.id,
          email: u.email,
          passwordHash: hash,
          name: u.email,
          role: u.role,
          isActive: true,
        });
      },
    );

    const groupBy = jest.fn((a: { by: string[] }) => {
      const key = a.by.join('+');
      if (key === 'resultado')
        return Promise.resolve([
          { resultado: 'SOLUCIONADO_MESA', ...count(10) },
        ]);
      if (key === 'ubicacion')
        return Promise.resolve([{ ubicacion: 'Caraballeda', ...count(3) }]);
      if (key === 'ubicacion+motivo')
        return Promise.resolve([
          {
            ubicacion: 'Caraballeda',
            motivo: 'Corte de fibra (FTTH)',
            ...count(3),
          },
        ]);
      return Promise.resolve([]);
    });
    const findMany = jest.fn(
      (a: { where?: { resultado?: unknown; fecha?: { gte?: Date } } }) => {
        if (a.where?.resultado) {
          const todas = [
            {
              id: 'abc123def0',
              resultado: 'ESCALADO_NOC',
              motivo: 'Corte de fibra (FTTH)',
              ubicacion: 'Caraballeda',
              abonado: 'Ab-1',
              fecha: new Date(efectiva.getTime() - 2 * 86_400_000),
            },
            {
              // 40 días: fuera de la ventana de 30 días → no debe aparecer.
              id: 'old999',
              resultado: 'ENVIADO_SOPORTE2',
              motivo: 'Sin señal / ONT',
              ubicacion: 'Naiguatá',
              abonado: 'Ab-old',
              fecha: new Date(efectiva.getTime() - 40 * 86_400_000),
            },
          ];
          const gte = a.where.fecha?.gte;
          return Promise.resolve(
            gte
              ? todas.filter((t) => t.fecha.getTime() >= gte.getTime())
              : todas,
          );
        }
        return Promise.resolve([
          {
            id: 'r1',
            fecha: efectiva,
            abonado: 'Ab-9',
            operador: { name: 'Op' },
          },
        ]);
      },
    );
    deleteMany = jest.fn().mockResolvedValue({ count: 2 });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique, findMany: jest.fn().mockResolvedValue([]) },
        gestion: { groupBy, findMany, deleteMany },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    for (const email of Object.keys(USERS)) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: PASSWORD });
      tokens[email] = (res.body as LoginBody).accessToken;
    }
  });

  afterAll(async () => {
    await app?.close();
  });

  const server = () => app.getHttpServer();

  describe('GET /supervision/resumen', () => {
    it('401 sin token', async () => {
      await request(server()).get('/supervision/resumen').expect(401);
    });

    it('403 con rol OPERADOR', async () => {
      await request(server())
        .get('/supervision/resumen')
        .set('Authorization', `Bearer ${tokens['operador@fibex.com']}`)
        .expect(403);
    });

    it('200 con rol ADMIN y forma exacta del DTO', async () => {
      const res = await request(server())
        .get(`/supervision/resumen?fecha=${FECHA}`)
        .set('Authorization', `Bearer ${tokens['admin@fibex.com']}`)
        .expect(200);

      expect(Object.keys(res.body as object).sort()).toEqual([
        'bandejaN2',
        'depuracion',
        'fecha',
        'heatmap',
        'kpis',
        'sla',
        'zonas',
      ]);
      const body = res.body as {
        fecha: string;
        kpis: Record<string, number>;
        zonas: unknown[];
        bandejaN2: { orden: string; dias: number }[];
        sla: { key: string; count: number }[];
        heatmap: { motivos: string[]; filas: unknown[] };
      };
      expect(body.fecha).toBe(FECHA);
      expect(body.kpis.efectividad).toBe(100);
      expect(body.zonas).toHaveLength(1);
      // id 'abc123def0' → últimos 6 en mayúsculas
      expect(body.bandejaN2[0].orden).toBe('#OS-23DEF0');
      expect(body.bandejaN2[0].dias).toBe(2);
      // La abierta de 40 días queda fuera de la ventana de 30 días.
      expect(body.bandejaN2).toHaveLength(1);
      expect(body.sla.find((s) => s.key === '4+')).toMatchObject({ count: 0 });
      expect(body.sla.map((s) => s.key)).toEqual(['0', '1', '2', '3', '4+']);
      expect(body.heatmap.motivos).toEqual(['Corte de fibra (FTTH)']);
    });

    it('200 con rol SUPERVISOR', async () => {
      await request(server())
        .get(`/supervision/resumen?fecha=${FECHA}`)
        .set('Authorization', `Bearer ${tokens['super@fibex.com']}`)
        .expect(200);
    });

    it('400 con fecha malformada', async () => {
      await request(server())
        .get('/supervision/resumen?fecha=22-07-2026')
        .set('Authorization', `Bearer ${tokens['admin@fibex.com']}`)
        .expect(400);
    });
  });

  describe('DELETE /supervision/gestiones', () => {
    it('401 sin token', async () => {
      await request(server())
        .delete('/supervision/gestiones')
        .send({ ids: ['a'] })
        .expect(401);
    });

    it('403 con rol OPERADOR', async () => {
      await request(server())
        .delete('/supervision/gestiones')
        .set('Authorization', `Bearer ${tokens['operador@fibex.com']}`)
        .send({ ids: ['a'] })
        .expect(403);
    });

    it('400 con array vacío', async () => {
      await request(server())
        .delete('/supervision/gestiones')
        .set('Authorization', `Bearer ${tokens['admin@fibex.com']}`)
        .send({ ids: [] })
        .expect(400);
    });

    it('200 borra y devuelve el conteo', async () => {
      const res = await request(server())
        .delete('/supervision/gestiones')
        .set('Authorization', `Bearer ${tokens['admin@fibex.com']}`)
        .send({ ids: ['a', 'b'] })
        .expect(200);
      expect(res.body).toEqual({ deleted: 2 });
      expect(deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['a', 'b'] } },
      });
    });
  });
});
