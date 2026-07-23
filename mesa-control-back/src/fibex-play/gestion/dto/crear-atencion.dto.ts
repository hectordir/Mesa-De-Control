import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsString, Length } from 'class-validator';

import { EstadoAtencion } from '../../../generated/prisma/enums';
import { CANALES, ESTADOS, MOTIVOS, SOLUCIONES } from '../catalogos';

/**
 * Alta de una atención de la bitácora App Fibex. `canal`/`motivo`/`solucion`
 * se validan contra el catálogo (fuente única); `estado` contra el enum Prisma.
 * El service valida además que `operadorId` exista.
 */
export class CrearAtencionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Autoría; debe referenciar un usuario existente.',
  })
  @IsString()
  @Length(1, 120)
  operadorId!: string;

  @ApiProperty({ example: 'Cond. Los Robles', minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120, { message: 'abonado debe tener entre 1 y 120 caracteres' })
  abonado!: string;

  @ApiProperty({ enum: CANALES, example: 'ESPN' })
  @IsIn(CANALES, {
    message: 'canal debe ser un valor del catálogo',
  })
  canal!: string;

  @ApiProperty({ enum: MOTIVOS, example: 'Sin señal' })
  @IsIn(MOTIVOS, { message: 'motivo debe ser un valor del catálogo' })
  motivo!: string;

  @ApiProperty({ enum: SOLUCIONES, example: 'Reinicio de ONU' })
  @IsIn(SOLUCIONES, {
    message: 'solucion debe ser un valor del catálogo',
  })
  solucion!: string;

  @ApiProperty({ enum: ESTADOS, example: 'SOLUCIONADO' })
  @IsEnum(
    {
      SOLUCIONADO: 'SOLUCIONADO',
      EN_PROCESO: 'EN_PROCESO',
      ESCALADO: 'ESCALADO',
    },
    { message: 'estado debe ser SOLUCIONADO, EN_PROCESO o ESCALADO' },
  )
  estado!: EstadoAtencion;
}
