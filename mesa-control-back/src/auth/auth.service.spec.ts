import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// `compare` se envuelve en un jest.fn que delega en la implementación real:
// el binding nativo de bcrypt no es reconfigurable, así que no se puede espiar directamente.
jest.mock('bcrypt', () => {
  const actual = jest.requireActual<typeof import('bcrypt')>('bcrypt');
  return {
    ...actual,
    compare: jest.fn((data: string, hash: string) =>
      actual.compare(data, hash),
    ),
  };
});

import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const PASSWORD = 'Fibex2026!';

type UserRow = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'OPERADOR' | 'SUPERVISOR' | 'ADMIN';
  isActive: boolean;
};

describe('AuthService', () => {
  let service: AuthService;
  let findUnique: jest.Mock;
  let baseUser: UserRow;

  beforeAll(() => {
    // hash once for the whole suite (bcrypt is intentionally slow)
    baseUser = {
      id: 'u-1',
      email: 'operador@fibex.com',
      passwordHash: bcrypt.hashSync(PASSWORD, 4),
      name: 'Operador Demo',
      role: 'OPERADOR',
      isActive: true,
    };
  });

  beforeEach(async () => {
    findUnique = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { user: { findUnique } } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('devuelve accessToken y usuario público con credenciales válidas', async () => {
    findUnique.mockResolvedValue({ ...baseUser });

    const result = await service.login({
      email: 'operador@fibex.com',
      password: PASSWORD,
    });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.user).toEqual({
      id: 'u-1',
      email: 'operador@fibex.com',
      name: 'Operador Demo',
      role: 'OPERADOR',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('normaliza el email (trim + minúsculas) antes de buscar', async () => {
    findUnique.mockResolvedValue({ ...baseUser });

    await service.login({
      email: '  Operador@Fibex.com  ',
      password: PASSWORD,
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: { email: 'operador@fibex.com' },
    });
  });

  it('lanza UnauthorizedException genérica con password errónea', async () => {
    findUnique.mockResolvedValue({ ...baseUser });

    await expect(
      service.login({ email: 'operador@fibex.com', password: 'incorrecta' }),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
  });

  it('lanza el mismo error si el email no existe', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nadie@fibex.com', password: PASSWORD }),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
  });

  it('ejecuta una comparación dummy cuando el email no existe (anti-timing)', async () => {
    findUnique.mockResolvedValue(null);
    const compareMock = bcrypt.compare as unknown as jest.Mock;
    compareMock.mockClear();

    await expect(
      service.login({ email: 'nadie@fibex.com', password: PASSWORD }),
    ).rejects.toThrow(UnauthorizedException);

    expect(compareMock).toHaveBeenCalledTimes(1);
    const [, hashArg] = compareMock.mock.calls[0] as [string, string];
    expect(hashArg).toMatch(/^\$2[aby]\$/);
  });

  it('lanza el mismo error si el usuario está inactivo', async () => {
    findUnique.mockResolvedValue({ ...baseUser, isActive: false });

    await expect(
      service.login({ email: 'operador@fibex.com', password: PASSWORD }),
    ).rejects.toThrow(new UnauthorizedException('Credenciales inválidas'));
  });

  describe('validateJwtUser', () => {
    it('devuelve el usuario público de un id activo', async () => {
      findUnique.mockResolvedValue({ ...baseUser });

      await expect(service.validateJwtUser('u-1')).resolves.toEqual({
        id: 'u-1',
        email: 'operador@fibex.com',
        name: 'Operador Demo',
        role: 'OPERADOR',
      });
    });

    it('lanza UnauthorizedException si el usuario no existe o está inactivo', async () => {
      findUnique.mockResolvedValue(null);
      await expect(service.validateJwtUser('nope')).rejects.toThrow(
        UnauthorizedException,
      );

      findUnique.mockResolvedValue({ ...baseUser, isActive: false });
      await expect(service.validateJwtUser('u-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
