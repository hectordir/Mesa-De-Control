import { ApiProperty } from '@nestjs/swagger';

export type ZonaEstado = 'danger' | 'warning' | 'info' | 'success';

export class SupervisionKpisDto {
  @ApiProperty({ example: 342, description: 'Gestiones de la fecha' })
  atendidosHoy!: number;

  @ApiProperty({ example: 24, description: 'Atendidos hoy − día anterior' })
  atendidosDelta!: number;

  @ApiProperty({ example: 58, minimum: 0, maximum: 100 })
  efectividad!: number;

  @ApiProperty({ example: 85 })
  efectividadMeta!: number;

  @ApiProperty({ example: 31 })
  escaladosNoc!: number;

  @ApiProperty({ example: -3, description: 'Escalados NOC hoy − día anterior' })
  escaladosDelta!: number;

  @ApiProperty({ example: 90, minimum: 0, maximum: 100 })
  slaCumplido!: number;

  @ApiProperty({ example: 90 })
  slaMeta!: number;
}

export class SupervisionZonaDto {
  @ApiProperty({ example: 'Caraballeda' })
  nombre!: string;

  @ApiProperty({ example: 12 })
  count!: number;

  @ApiProperty({
    enum: ['danger', 'warning', 'info', 'success'],
    example: 'danger',
  })
  estado!: ZonaEstado;
}

export class SupervisionBandejaItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '#OS-4F2A1C' })
  orden!: string;

  @ApiProperty({ example: 'Cond. Los Robles 4B' })
  abonado!: string;

  @ApiProperty({ example: 'Caraballeda' })
  zona!: string;

  @ApiProperty({ example: 'Corte de fibra (FTTH)' })
  motivo!: string;

  @ApiProperty({ example: 3, description: 'Días abierta desde `fecha`' })
  dias!: number;

  @ApiProperty({ example: 'Escalado NOC' })
  estado!: string;
}

export class SupervisionSlaBucketDto {
  @ApiProperty({ example: '0' })
  key!: string;

  @ApiProperty({ example: 'Hoy' })
  label!: string;

  @ApiProperty({ example: 8 })
  count!: number;
}

export class SupervisionHeatmapFilaDto {
  @ApiProperty({ example: 'Caraballeda' })
  zona!: string;

  @ApiProperty({ type: [Number], example: [3, 1, 0, 2] })
  celdas!: number[];

  @ApiProperty({ example: 6 })
  total!: number;
}

export class SupervisionHeatmapDto {
  @ApiProperty({ type: [String], example: ['Corte de fibra (FTTH)'] })
  motivos!: string[];

  @ApiProperty({ type: [SupervisionHeatmapFilaDto] })
  filas!: SupervisionHeatmapFilaDto[];
}

export class SupervisionDepuracionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '2026-07-22' })
  fecha!: string;

  @ApiProperty({ example: 'Jhon Rivas' })
  operador!: string;

  @ApiProperty({ example: 'Cond. Los Robles 4B' })
  abonado!: string;
}

export class SupervisionResumenDto {
  @ApiProperty({ example: '2026-07-22', description: 'Fecha efectiva (ISO)' })
  fecha!: string;

  @ApiProperty({ type: SupervisionKpisDto })
  kpis!: SupervisionKpisDto;

  @ApiProperty({
    type: [SupervisionZonaDto],
    description: 'Incidencias por zona (ubicacion) en la fecha',
  })
  zonas!: SupervisionZonaDto[];

  @ApiProperty({
    type: [SupervisionBandejaItemDto],
    description:
      'Gestiones abiertas escaladas a N2/NOC, por antigüedad desc (máx 20)',
  })
  bandejaN2!: SupervisionBandejaItemDto[];

  @ApiProperty({
    type: [SupervisionSlaBucketDto],
    description: 'Abiertas agrupadas por antigüedad: 0,1,2,3,4+ días',
  })
  sla!: SupervisionSlaBucketDto[];

  @ApiProperty({ type: SupervisionHeatmapDto })
  heatmap!: SupervisionHeatmapDto;

  @ApiProperty({
    type: [SupervisionDepuracionItemDto],
    description: 'Últimas ~20 gestiones por createdAt desc',
  })
  depuracion!: SupervisionDepuracionItemDto[];
}
