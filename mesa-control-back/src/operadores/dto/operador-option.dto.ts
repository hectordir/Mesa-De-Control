import { ApiProperty } from '@nestjs/swagger';

/** Opción del select de operadores en `/registro`. */
export class OperadorOptionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Cristhian Rangel' })
  nombre!: string;
}
