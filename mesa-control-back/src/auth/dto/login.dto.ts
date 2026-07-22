import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'operador@fibex.com', format: 'email' })
  // Se normaliza antes de validar: el email no distingue mayúsculas ni espacios al borde.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email debe ser un correo válido' })
  email!: string;

  @ApiProperty({ example: 'Fibex2026!', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'password debe tener al menos 8 caracteres' })
  password!: string;
}
