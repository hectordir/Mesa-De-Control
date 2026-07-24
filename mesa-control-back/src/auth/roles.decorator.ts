import { SetMetadata } from '@nestjs/common';

import { Role } from '../generated/prisma/enums';

/** Clave de metadata donde `@Roles` deja los roles permitidos de un handler. */
export const ROLES_KEY = 'roles';

/**
 * Declara qué roles pueden acceder a un endpoint. Lo lee `RolesGuard`, que debe
 * correr **después** de `JwtAuthGuard` (necesita `request.user`). Sin este
 * decorador, `RolesGuard` deja pasar (retrocompatible).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
