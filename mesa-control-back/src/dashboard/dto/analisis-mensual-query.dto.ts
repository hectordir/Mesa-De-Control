import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

/** Formato `YYYY-MM` con mes entre 01 y 12: `2026-13` no pasa. */
export const PERIODO_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export class AnalisisMensualQueryDto {
  @ApiPropertyOptional({
    description: 'Mes a consultar. Por defecto, el mes en curso.',
    example: '2026-05',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
  })
  @IsOptional()
  @Matches(PERIODO_PATTERN, {
    message: 'periodo debe tener el formato YYYY-MM (mes entre 01 y 12)',
  })
  periodo?: string;
}
