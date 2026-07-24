import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class DeleteGestionesDto {
  @ApiProperty({
    type: [String],
    description: 'Ids de las gestiones a depurar (borrado real). No vacío.',
    example: ['seed-2026-07-22-0001', 'seed-2026-07-22-0002'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'ids no puede estar vacío' })
  @IsString({ each: true })
  ids!: string[];
}

export class DeleteGestionesResultDto {
  @ApiProperty({ example: 2, description: 'Cantidad de gestiones borradas' })
  deleted!: number;
}
