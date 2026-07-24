import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, Matches } from 'class-validator';

export class SupervisionQueryDto {
  @ApiPropertyOptional({
    description: 'Fecha de auditoría a consultar. Por defecto, hoy.',
    example: '2026-07-22',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato YYYY-MM-DD',
  })
  @IsISO8601({ strict: true }, { message: 'fecha debe ser un día válido' })
  fecha?: string;
}
