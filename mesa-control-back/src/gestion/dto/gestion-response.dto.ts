import { ApiProperty } from '@nestjs/swagger';

import { ResultadoGestion } from '../../generated/prisma/enums';

const RESULTADO_ENUM = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
] as const;

export class GestionOperadorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Operador Demo' })
  nombre!: string;
}

export class GestionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '2026-07-22', description: 'Día de operación' })
  fecha!: string;

  @ApiProperty({ type: GestionOperadorDto })
  operador!: GestionOperadorDto;

  @ApiProperty({ example: 'Cond. Los Robles' })
  abonado!: string;

  @ApiProperty({ example: '0412 555 1234' })
  telefono!: string;

  @ApiProperty({ example: 'Sin Internet' })
  detalle!: string;

  @ApiProperty({ example: 'Reinicio de ONU' })
  solucion!: string;

  @ApiProperty({ enum: RESULTADO_ENUM, example: 'SOLUCIONADO_MESA' })
  resultado!: ResultadoGestion;

  @ApiProperty({ example: 'Mesa' })
  tipo!: string;

  @ApiProperty({ example: false })
  requiereVisita!: boolean;

  @ApiProperty({ example: 'Caraballeda', description: 'Zona del reporte' })
  zona!: string;

  @ApiProperty({ example: 'Corte de fibra' })
  motivo!: string;

  @ApiProperty({ example: 'Cliente notificado; se agenda seguimiento.' })
  observacion!: string;

  @ApiProperty({ example: '10.6012, -66.9311', nullable: true })
  coordenadas!: string | null;

  @ApiProperty({
    format: 'date-time',
    example: '2026-07-22T10:42:00.000Z',
    description: 'Instante de registro (createdAt) en ISO 8601',
  })
  createdAt!: string;
}
