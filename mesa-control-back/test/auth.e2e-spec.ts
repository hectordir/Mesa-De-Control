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
type LoginBody = { accessToken: string; user: Record<string, unknown> };

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let findUnique: jest.Mock;
  let user: {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    isActive: boolean;
  };

  beforeAll(async () => {
    user = {
      id: 'u-1',
      email: 'operador@fibex.com',
      passwordHash: bcrypt.hashSync(PASSWORD, 4),
      name: 'Operador Demo',
      role: 'OPERADOR',
      isActive: true,
    };
    findUnique = jest.fn();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({ user: { findUnique } })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    findUnique.mockReset();
    findUnique.mockResolvedValue({ ...user });
  });

  describe('POST /auth/login', () => {
    it('200 + accessToken y usuario público con credenciales válidas', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'operador@fibex.com', password: PASSWORD })
        .expect(200);

      const body = res.body as LoginBody;
      expect(typeof body.accessToken).toBe('string');
      expect(body.accessToken.length).toBeGreaterThan(20);
      expect(body.user).toEqual({
        id: 'u-1',
        email: 'operador@fibex.com',
        name: 'Operador Demo',
        role: 'OPERADOR',
      });
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('200 con el email en mayúsculas y con espacios (se normaliza)', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: '  OPERADOR@Fibex.com  ', password: PASSWORD })
        .expect(200);

      expect(findUnique).toHaveBeenCalledWith({
        where: { email: 'operador@fibex.com' },
      });
    });

    it('401 genérico con password errónea', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'operador@fibex.com', password: 'noesestaclave' })
        .expect(401);

      expect((res.body as ErrorBody).message).toBe('Credenciales inválidas');
    });

    it('401 con el mismo mensaje si el email no existe', async () => {
      findUnique.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'fantasma@fibex.com', password: PASSWORD })
        .expect(401);

      expect((res.body as ErrorBody).message).toBe('Credenciales inválidas');
    });

    it('401 si el usuario está inactivo', async () => {
      findUnique.mockResolvedValue({ ...user, isActive: false });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'operador@fibex.com', password: PASSWORD })
        .expect(401);
    });

    it('400 con email inválido o password corta', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'no-es-email', password: 'corta' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(Array.isArray(body.message)).toBe(true);
      expect((body.message as string[]).join(' ')).toMatch(/email/i);
    });

    it('400 si se envían propiedades no permitidas', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'operador@fibex.com',
          password: PASSWORD,
          role: 'ADMIN',
        })
        .expect(400);
    });
  });

  describe('GET /auth/me', () => {
    const bearer = async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'operador@fibex.com', password: PASSWORD });
      return (res.body as LoginBody).accessToken;
    };

    it('401 sin token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('401 con token malformado', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer no.es.un.jwt')
        .expect(401);
    });

    it('200 + usuario público con token válido y sin passwordHash', async () => {
      const token = await bearer();

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body as Record<string, unknown>).toEqual({
        id: 'u-1',
        email: 'operador@fibex.com',
        name: 'Operador Demo',
        role: 'OPERADOR',
      });
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('401 si el usuario del token ya no está activo', async () => {
      const token = await bearer();
      findUnique.mockResolvedValue({ ...user, isActive: false });

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
