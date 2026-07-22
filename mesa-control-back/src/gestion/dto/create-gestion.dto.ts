import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

import { ResultadoGestion } from '../../generated/prisma/enums';

const RESULTADO_ENUM = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
] as const;

/**
 * Alta de una gestión. El `operadorId` NUNCA viaja en el body: se toma de `req.user`.
 * `zona` se persiste en la columna `ubicacion`; el pin exacto va en `coordenadas`.
 */
export class CreateGestionDto {
  @ApiProperty({
    description: 'Día de operación (por defecto hoy).',
    example: '2026-07-22',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener el formato YYYY-MM-DD',
  })
  fecha!: string;

  @ApiProperty({
    example: 'Cond. Los Robles',
    description: 'Abonado/condominio',
  })
  @IsString()
  @IsNotEmpty({ message: 'abonado es obligatorio' })
  abonado!: string;

  @ApiProperty({ example: '0412 555 1234' })
  @IsString()
  @IsNotEmpty({ message: 'telefono es obligatorio' })
  telefono!: string;

  @ApiProperty({ example: 'Sin Internet', description: 'Detalle de la orden' })
  @IsString()
  @IsNotEmpty({ message: 'detalle es obligatorio' })
  detalle!: string;

  @ApiProperty({ example: 'Reinicio de ONU', description: 'Solución aplicada' })
  @IsString()
  @IsNotEmpty({ message: 'solucion es obligatorio' })
  solucion!: string;

  @ApiProperty({ enum: RESULTADO_ENUM, example: 'SOLUCIONADO_MESA' })
  @IsEnum(RESULTADO_ENUM, {
    message: 'resultado debe ser un valor válido de ResultadoGestion',
  })
  resultado!: ResultadoGestion;

  @ApiPropertyOptional({ example: 'Mesa', description: 'Tipo de resolución' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  requiereVisita?: boolean;

  @ApiProperty({ example: 'Caraballeda', description: 'Zona del reporte' })
  @IsString()
  @IsNotEmpty({ message: 'zona es obligatorio' })
  zona!: string;

  @ApiProperty({
    example: 'Corte de fibra',
    description: 'Motivo de la incidencia',
  })
  @IsString()
  @IsNotEmpty({ message: 'motivo es obligatorio' })
  motivo!: string;

  @ApiProperty({ example: 'Cliente notificado; se agenda seguimiento.' })
  @IsString()
  @IsNotEmpty({ message: 'observacion es obligatorio' })
  observacion!: string;

  @ApiPropertyOptional({
    example: '10.6012, -66.9311',
    description: "Pin exacto 'lat, lng'; opcional.",
    nullable: true,
  })
  @IsOptional()
  @IsString()
  coordenadas?: string | null;
}
