import { ApiProperty } from '@nestjs/swagger';

import {
  CategoriaCanal,
  SeveridadIncidencia,
  TipoIncidencia,
} from '../../generated/prisma/enums';

const CATEGORIA_ENUM = [
  'DEPORTES',
  'INFANTIL',
  'NOTICIAS',
  'DOCUMENTALES',
  'PREMIUM',
  'GENERAL',
  'MUSICA',
] as const;

const TIPO_INCIDENCIA_ENUM = [
  'SIN_SENAL',
  'VIDEO_PIXELADO',
  'IMAGEN_CONGELADA',
  'AUDIO_DESINCRONIZADO',
  'SENAL_INTERMITENTE',
] as const;

const SEVERIDAD_ENUM = ['CRITICA', 'ALTA', 'MEDIA'] as const;

export class FibexPlayKpisDto {
  @ApiProperty({ example: 165, description: 'Canales totales de la grilla' })
  total!: number;

  @ApiProperty({ example: 159, description: 'Canales OPERATIVO' })
  operativos!: number;

  @ApiProperty({ example: 6, description: 'Canales CAIDO' })
  caidos!: number;

  @ApiProperty({
    example: 96,
    minimum: 0,
    maximum: 100,
    description: 'round(operativos/total*100); 100 si total=0',
  })
  saludGrilla!: number;
}

export class DistribucionSeveridadDto {
  @ApiProperty({ enum: SEVERIDAD_ENUM, example: 'CRITICA' })
  severidad!: SeveridadIncidencia;

  @ApiProperty({ example: 2 })
  total!: number;
}

export class FallaCanalDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ESPN' })
  nombre!: string;

  @ApiProperty({ enum: CATEGORIA_ENUM, example: 'DEPORTES' })
  categoria!: CategoriaCanal;

  @ApiProperty({ enum: TIPO_INCIDENCIA_ENUM, example: 'SIN_SENAL' })
  tipoIncidencia!: TipoIncidencia;

  @ApiProperty({ enum: SEVERIDAD_ENUM, example: 'CRITICA' })
  severidad!: SeveridadIncidencia;

  @ApiProperty({
    example: '09:42',
    description: 'HH:mm derivado de detectadoEn',
  })
  hora!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-07-22T09:42:00.000Z',
  })
  detectadoEn!: string;
}

export class FibexPlayResumenDto {
  @ApiProperty({
    format: 'date-time',
    example: '2026-07-22T10:58:00.000Z',
    description: 'Instante del snapshot (now() del servidor) en ISO 8601',
  })
  actualizadoEn!: string;

  @ApiProperty({ type: FibexPlayKpisDto })
  kpis!: FibexPlayKpisDto;

  @ApiProperty({
    type: [DistribucionSeveridadDto],
    description:
      'Solo severidades con total>0, orden Crítica→Alta→Media. Vacío ⇒ grilla estable',
  })
  distribucionSeveridad!: DistribucionSeveridadDto[];

  @ApiProperty({
    type: [FallaCanalDto],
    description: 'Canales CAIDO ordenados por detectadoEn ascendente',
  })
  fallas!: FallaCanalDto[];
}
