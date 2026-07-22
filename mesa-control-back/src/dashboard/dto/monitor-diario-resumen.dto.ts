import { ApiProperty } from '@nestjs/swagger';

import { ResultadoGestion } from '../../generated/prisma/enums';

const RESULTADO_ENUM = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
] as const;

export class KpiResumenDto {
  @ApiProperty({ example: 342, description: 'Gestiones del día' })
  clientesAtendidos!: number;

  @ApiProperty({ example: 58, minimum: 0, maximum: 100 })
  efectividadMesa!: number;

  @ApiProperty({ example: 54 })
  enviadoSoporte2!: number;

  @ApiProperty({ example: 31 })
  escaladoNoc!: number;

  @ApiProperty({ example: 38 })
  pendienteCliente!: number;
}

export class OperadorResumenDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jhon Rivas' })
  nombre!: string;

  @ApiProperty({ example: 78, description: 'Total de gestiones del operador' })
  clientes!: number;

  @ApiProperty({ example: 63, description: 'SOLUCIONADO_MESA' })
  mesa!: number;

  @ApiProperty({ example: 11, description: 'ENVIADO_SOPORTE2' })
  soporte2!: number;

  @ApiProperty({ example: 7, description: 'ESCALADO_NOC' })
  noc!: number;
}

export class DistribucionItemDto {
  @ApiProperty({ enum: RESULTADO_ENUM, example: 'SOLUCIONADO_MESA' })
  resultado!: ResultadoGestion;

  @ApiProperty({ example: 198 })
  total!: number;
}

export class AveriaItemDto {
  @ApiProperty({ example: 'Corte de fibra (FTTH)' })
  motivo!: string;

  @ApiProperty({ example: 84 })
  total!: number;
}

export class ActividadItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Jhon Rivas' })
  operador!: string;

  @ApiProperty({ enum: RESULTADO_ENUM, example: 'SOLUCIONADO_MESA' })
  resultado!: ResultadoGestion;

  @ApiProperty({ example: 'Cond. Los Robles' })
  ubicacion!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-07-22T10:42:00.000Z',
    description: 'Instante de registro (createdAt) en ISO 8601',
  })
  hora!: string;
}

export class MonitorDiarioResumenDto {
  @ApiProperty({ example: '2026-07-22', description: 'Día de operación' })
  fecha!: string;

  @ApiProperty({ type: KpiResumenDto })
  kpis!: KpiResumenDto;

  @ApiProperty({
    type: [OperadorResumenDto],
    description: 'Solo operadores con al menos una gestión, por clientes desc',
  })
  operadores!: OperadorResumenDto[];

  @ApiProperty({
    type: [DistribucionItemDto],
    description:
      'Los 5 resultados siempre presentes, incluidos los que valen 0',
  })
  distribucion!: DistribucionItemDto[];

  @ApiProperty({ type: [AveriaItemDto], description: 'Máximo 5, total desc' })
  topAverias!: AveriaItemDto[];

  @ApiProperty({
    type: [ActividadItemDto],
    description: 'Las 20 gestiones más recientes',
  })
  actividad!: ActividadItemDto[];
}
