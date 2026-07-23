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

export class AnalisisMensualMotivoDto {
  @ApiProperty({ example: 'Falla LOS' })
  motivo!: string;

  @ApiProperty({
    example: 140,
    description: 'Gestiones del mes con ese motivo',
  })
  total!: number;
}

export class AnalisisMensualOperadorDto {
  @ApiProperty({ example: 'u-1' })
  id!: string;

  @ApiProperty({ example: 'José V.' })
  nombre!: string;

  @ApiProperty({ example: 79, description: 'resultado = SOLUCIONADO_MESA' })
  solucionados!: number;

  @ApiProperty({
    example: 67,
    description: 'resultado = ENVIADO_SOPORTE2 (Nivel 2)',
  })
  enviadosN2!: number;

  @ApiProperty({
    example: 159,
    description: 'Todas las gestiones del operador en el mes',
  })
  total!: number;
}

export class AnalisisMensualDiaDto {
  @ApiProperty({ example: '2026-05-20', description: 'YYYY-MM-DD' })
  fecha!: string;

  @ApiProperty({ example: 40, description: 'Gestiones de ese día' })
  atendidos!: number;
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

  @ApiProperty({
    type: [AnalisisMensualMotivoDto],
    description:
      'Todos los motivos del mes, orden desc por total (desempate alfabético)',
  })
  distribucion!: AnalisisMensualMotivoDto[];

  @ApiProperty({
    type: [AnalisisMensualOperadorDto],
    description:
      'Operadores con gestiones en el mes, orden desc por total (desempate por nombre)',
  })
  operadores!: AnalisisMensualOperadorDto[];

  @ApiProperty({
    type: [AnalisisMensualDiaDto],
    description: 'Solo días con gestiones, en orden cronológico',
  })
  tendencia!: AnalisisMensualDiaDto[];
}
