import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from '../generated/prisma/enums';
import { ROLES_KEY } from './roles.decorator';

/**
 * Autoriza por rol. Lee los roles de `@Roles(...)` (nivel handler o clase) y los
 * compara contra `request.user.role`. Debe aplicarse **después** de `JwtAuthGuard`.
 * Sin `@Roles`, deja pasar (retrocompatible con endpoints solo autenticados).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Endpoint sin restricción de rol: basta con estar autenticado.
    if (!permitidos || permitidos.length === 0) return true;

    const user = context
      .switchToHttp()
      .getRequest<{ user?: { role?: Role } }>().user;

    if (!user?.role || !permitidos.includes(user.role)) {
      throw new ForbiddenException('No tiene permisos para este recurso');
    }
    return true;
  }
}
