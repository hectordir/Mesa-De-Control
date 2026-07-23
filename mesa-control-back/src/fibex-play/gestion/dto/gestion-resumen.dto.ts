import { ApiProperty } from '@nestjs/swagger';

import { EstadoAtencion } from '../../../generated/prisma/enums';

export class GestionKpisDto {
  @ApiProperty({ example: 24 }) totalAtendidos!: number;
  @ApiProperty({ example: 16 }) solucionados!: number;
  @ApiProperty({ example: 5 }) enProceso!: number;
  @ApiProperty({ example: 3 }) escalados!: number;
}

export class TopCanalItemDto {
  @ApiProperty({ example: 'ESPN' }) canal!: string;
  @ApiProperty({ example: 6 }) total!: number;
}

export class OrigenItemDto {
  @ApiProperty({ example: 'Señal / Transmisión' }) origen!: string;
  @ApiProperty({ example: 10 }) total!: number;
}

export class RegistroAtencionDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Jhon Rivas' }) operador!: string;
  @ApiProperty({ example: 'Cond. Los Robles' }) abonado!: string;
  @ApiProperty({ example: 'ESPN' }) canal!: string;
  @ApiProperty({ example: 'Sin señal' }) motivo!: string;
  @ApiProperty({ example: 'Reinicio de ONU' }) solucion!: string;
  @ApiProperty({ enum: ['SOLUCIONADO', 'EN_PROCESO', 'ESCALADO'] })
  estado!: EstadoAtencion;
  @ApiProperty({ format: 'date-time', example: '2026-07-22T14:12:00.000Z' })
  creadoEn!: string;
}

export class CatalogosDto {
  @ApiProperty({ type: [String] }) canales!: string[];
  @ApiProperty({ type: [String] }) motivos!: string[];
  @ApiProperty({ type: [String] }) soluciones!: string[];
  @ApiProperty({
    type: [String],
    example: ['SOLUCIONADO', 'EN_PROCESO', 'ESCALADO'],
  })
  estados!: string[];
}

export class GestionResumenDto {
  @ApiProperty({ type: GestionKpisDto }) kpis!: GestionKpisDto;
  @ApiProperty({ type: [TopCanalItemDto] }) topCanales!: TopCanalItemDto[];
  @ApiProperty({ type: [OrigenItemDto] }) origen!: OrigenItemDto[];
  @ApiProperty({ type: [RegistroAtencionDto] })
  registros!: RegistroAtencionDto[];
  @ApiProperty({ type: CatalogosDto }) catalogos!: CatalogosDto;
}
