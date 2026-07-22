import { ApiProperty } from '@nestjs/swagger';

export class AnalisisMensualKpisDto {
  @ApiProperty({ example: 485, description: 'Gestiones del mes' })
  volumen!: number;

  @ApiProperty({ example: 209, description: 'resultado = SOLUCIONADO_MESA' })
  resueltos!: number;

  @ApiProperty({ example: 22, description: 'resultado = ESCALADO_NOC' })
  escalados!: number;

  @ApiProperty({
    example: 65,
    minimum: 0,
    maximum: 100,
    description: 'Meta de efectividad del equipo (constante de negocio)',
  })
  metaEfectividad!: number;
}

export class AnalisisMensualBarDto {
  @ApiProperty({ example: 'Febrero', description: 'Nombre del mes en español' })
  mes!: string;

  @ApiProperty({ example: '2026-02' })
  periodo!: string;

  @ApiProperty({ example: 545, description: 'SOLUCIONADO_MESA del mes' })
  resueltas!: number;

  @ApiProperty({ example: 735, description: 'El resto de resultados' })
  resto!: number;
}

export class AnalisisMensualZonaDto {
  @ApiProperty({ example: 'Canaima' })
  zona!: string;

  @ApiProperty({
    type: [Number],
    example: [3, 0, 5, 1, 0, 2],
    description: 'Un valor por motivo, en el orden de `motivos`',
  })
  valores!: number[];
}

export class AnalisisMensualHeatmapDto {
  @ApiProperty({
    type: [String],
    example: ['Falla LOS', 'Internet Lento'],
    description: 'Top 6 motivos del mes por volumen',
  })
  motivos!: string[];

  @ApiProperty({
    type: [AnalisisMensualZonaDto],
    description: 'Solo zonas con incidencias, en orden alfabético',
  })
  zonas!: AnalisisMensualZonaDto[];
}

export class AnalisisMensualDto {
  @ApiProperty({ example: '2026-05', description: 'Mes consultado (YYYY-MM)' })
  periodo!: string;

  @ApiProperty({ type: AnalisisMensualKpisDto })
  kpis!: AnalisisMensualKpisDto;

  @ApiProperty({
    type: [AnalisisMensualBarDto],
    description:
      'El mes pedido y los 3 anteriores, en orden cronológico; los meses sin datos viajan en 0',
  })
  serie!: AnalisisMensualBarDto[];

  @ApiProperty({ type: AnalisisMensualHeatmapDto })
  heatmap!: AnalisisMensualHeatmapDto;
}
