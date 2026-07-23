import { ApiProperty } from '@nestjs/swagger';

import { CanalGestion, ResultadoGestion } from '../../generated/prisma/enums';

const RESULTADO_ENUM = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
] as const;

const CANAL_ENUM = ['LLAMADA', 'WHATSAPP', 'TELEGRAM'] as const;

export class GestionListOperadorDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jhon Rivas' })
  nombre!: string;

  @ApiProperty({ example: 'JR', description: 'Iniciales derivadas del nombre' })
  iniciales!: string;
}

export class GestionListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: 'GST-40921',
    description: 'Código legible derivado del id (estable y determinista).',
  })
  codigo!: string;

  @ApiProperty({ type: GestionListOperadorDto })
  operador!: GestionListOperadorDto;

  @ApiProperty({ example: 'Cond. Los Robles' })
  abonado!: string;

  @ApiProperty({ example: '0412-118-4420' })
  telefono!: string;

  @ApiProperty({ example: 'Norte', description: 'Zona (columna ubicacion)' })
  zona!: string;

  @ApiProperty({ enum: CANAL_ENUM, nullable: true, example: 'TELEGRAM' })
  canal!: CanalGestion | null;

  @ApiProperty({ enum: RESULTADO_ENUM, example: 'SOLUCIONADO_MESA' })
  resultado!: ResultadoGestion;

  @ApiProperty({ example: '2026-07-17', description: 'YYYY-MM-DD' })
  fecha!: string;

  @ApiProperty({ example: '10:42', description: 'HH:mm derivado de createdAt' })
  hora!: string;

  @ApiProperty({
    example: 12,
    nullable: true,
    description: 'Duración en minutos',
  })
  duracionMin!: number | null;

  @ApiProperty({ example: 'Corte total de fibra' })
  detalle!: string;

  @ApiProperty({ example: 'Ticket generado a NOC' })
  solucion!: string;
}

export class GestionesCountsDto {
  @ApiProperty({
    example: 248,
    description: 'Total del conjunto filtrado sin el filtro `resultado`.',
  })
  total!: number;

  @ApiProperty({
    example: { SOLUCIONADO_MESA: 84, ESCALADO_NOC: 12 },
    description: 'Conteo por resultado (groupBy en Postgres), los 5 estados.',
  })
  porResultado!: Record<ResultadoGestion, number>;
}

export class GestionesListResponseDto {
  @ApiProperty({ type: [GestionListItemDto] })
  items!: GestionListItemDto[];

  @ApiProperty({
    example: 248,
    description: 'Total filtrado (incluye resultado)',
  })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  pageSize!: number;

  @ApiProperty({ type: GestionesCountsDto })
  counts!: GestionesCountsDto;
}
