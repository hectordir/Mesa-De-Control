import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { ResultadoGestion } from '../../generated/prisma/enums';

const RESULTADO_ENUM = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
] as const;

export const SORT_KEYS = [
  'fecha',
  'operador',
  // `abonado` (ubicación) se mantiene por compatibilidad aunque la tabla del
  // Historial ordene ya por `nombreCliente`.
  'abonado',
  'nombreCliente',
  'resultado',
  'zona',
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export type SortDir = 'asc' | 'desc';

const FECHA_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Filtros del listado paginado del Historial General. Todo opcional con
 * defaults aplicados en el service. El filtrado/orden/paginado ocurre en
 * Postgres (`where`/`orderBy`/`skip`/`take`/`groupBy`), nunca en memoria.
 */
export class ListGestionesQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    description: 'Página (1-indexed)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description:
      'contains case-insensitive sobre abonado, nombre del cliente, teléfono y operador.',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2026-07-01', description: 'fecha >= desde' })
  @IsOptional()
  @Matches(FECHA_PATTERN, { message: 'desde debe tener el formato YYYY-MM-DD' })
  desde?: string;

  @ApiPropertyOptional({ example: '2026-07-31', description: 'fecha <= hasta' })
  @IsOptional()
  @Matches(FECHA_PATTERN, { message: 'hasta debe tener el formato YYYY-MM-DD' })
  hasta?: string;

  @ApiPropertyOptional({ enum: RESULTADO_ENUM })
  @IsOptional()
  @IsIn(RESULTADO_ENUM, {
    message: 'resultado debe ser un valor válido de ResultadoGestion',
  })
  resultado?: ResultadoGestion;

  @ApiPropertyOptional({ enum: SORT_KEYS, default: 'fecha' })
  @IsOptional()
  @IsIn(SORT_KEYS, { message: 'sortKey inválido' })
  sortKey?: SortKey;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'], { message: 'sortDir debe ser asc o desc' })
  sortDir?: SortDir;
}
