import { ApiProperty } from '@nestjs/swagger';

import { Role } from '../../generated/prisma/enums';

export class PublicUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'operador@fibex.com' })
  email!: string;

  @ApiProperty({ example: 'Operador Demo' })
  name!: string;

  @ApiProperty({
    enum: ['OPERADOR', 'SUPERVISOR', 'ADMIN'],
    example: 'OPERADOR',
  })
  role!: Role;
}

export class LoginResponseDto {
  @ApiProperty({ description: 'JWT firmado, válido 1h' })
  accessToken!: string;

  @ApiProperty({ type: PublicUserDto })
  user!: PublicUserDto;
}
