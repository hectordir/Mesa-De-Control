import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from '../generated/prisma/enums';
import { RolesGuard } from './roles.guard';

/** Contexto mínimo: solo lo que `RolesGuard` usa (getHandler/getClass + request.user). */
const contexto = (role?: Role): ExecutionContext =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const guardCon = (permitidos?: Role[]) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(permitidos),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  it('deja pasar cuando el handler no declara @Roles', () => {
    expect(guardCon(undefined).canActivate(contexto('OPERADOR'))).toBe(true);
  });

  it('deja pasar cuando el rol del usuario está permitido', () => {
    const guard = guardCon(['ADMIN', 'SUPERVISOR']);
    expect(guard.canActivate(contexto('SUPERVISOR'))).toBe(true);
  });

  it('lanza 403 cuando el rol del usuario no está permitido', () => {
    const guard = guardCon(['ADMIN', 'SUPERVISOR']);
    expect(() => guard.canActivate(contexto('OPERADOR'))).toThrow(
      ForbiddenException,
    );
  });

  it('lanza 403 cuando no hay usuario en la request', () => {
    const guard = guardCon(['ADMIN']);
    expect(() => guard.canActivate(contexto(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
