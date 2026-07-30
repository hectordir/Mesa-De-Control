import { PartialType } from '@nestjs/swagger';

import { CreateGestionDto } from './create-gestion.dto';

/**
 * Edición parcial de una gestión (Historial · Editar gestión).
 *
 * Todos los campos de `CreateGestionDto` pasan a ser opcionales, pero **conservan
 * sus validadores**: un `""` explícito sigue devolviendo 400 (deseable — el modal
 * no debe poder vaciar un obligatorio).
 *
 * Inmutables por diseño y por tanto ausentes del DTO: `id`, `createdAt` (y con él
 * la `hora` y el `codigo`, derivados), `updatedAt` y `updatedBy` — la auditoría la
 * escribe el service desde el token, nunca el body. Con `forbidNonWhitelisted`
 * activo, enviarlos produce 400.
 */
export class UpdateGestionDto extends PartialType(CreateGestionDto) {}
