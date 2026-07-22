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
type OperadorOption = { id: string; nombre: string };

const USER = {
  id: 'u-1',
  email: 'operador@fibex.com',
  passwordHash: bcrypt.hashSync(PASSWORD, 4),
  name: 'Operador Demo',
  role: 'OPERADOR',
  isActive: true,
};

const OPERADORES = [
  { id: 'op-a', name: 'Andrea Pérez' },
  { id: 'op-b', name: 'Cristhian Rangel' },
];

describe('Operadores (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let findMany: jest.Mock;

  beforeAll(async () => {
    findMany = jest.fn().mockResolvedValue(OPERADORES);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique: jest.fn().mockResolvedValue(USER), findMany },
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

  it('401 sin token', async () => {
    await request(app.getHttpServer()).get('/operadores').expect(401);
  });

  it('200 con la lista de operadores (rol OPERADOR) como {id, nombre}', async () => {
    const res = await request(app.getHttpServer())
      .get('/operadores')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(findMany).toHaveBeenCalledWith({
      where: { role: 'OPERADOR' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    expect(res.body as OperadorOption[]).toEqual([
      { id: 'op-a', nombre: 'Andrea Pérez' },
      { id: 'op-b', nombre: 'Cristhian Rangel' },
    ]);
  });
});
