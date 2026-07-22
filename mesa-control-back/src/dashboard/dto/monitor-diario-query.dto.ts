import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, Matches } from 'class-validator';

export class MonitorDiarioQueryDto {
  @ApiPropertyOptional({
    description: 'Día de operación a consultar. Por defecto, hoy.',
    example: '2026-07-22',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  // `Matches` fija la forma (nada de timestamps ni `2026-7-2`) e `IsISO8601`
  // descarta días que no existen (`2026-13-45`).
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato YYYY-MM-DD',
  })
  @IsISO8601({ strict: true }, { message: 'fecha debe ser un día válido' })
  fecha?: string;
}
