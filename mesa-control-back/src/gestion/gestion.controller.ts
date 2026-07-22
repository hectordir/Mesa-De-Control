import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { GestionResponseDto } from './dto/gestion-response.dto';
import { GestionService } from './gestion.service';

@ApiTags('gestiones')
@Controller('gestiones')
export class GestionController {
  constructor(private readonly gestion: GestionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Registra una nueva gestión de la mesa',
    description:
      'La autoría (`operadorId`) viaja en el body y debe ser un usuario con rol ' +
      'OPERADOR (si no, 400). La zona se persiste en la columna `ubicacion` y ' +
      'alimenta los dashboards del mismo día/mes. Requiere JWT.',
  })
  @ApiCreatedResponse({ type: GestionResponseDto })
  @ApiBadRequestResponse({
    description:
      'Body inválido, campo obligatorio ausente u operadorId sin rol OPERADOR',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  crear(@Body() dto: CreateGestionDto): Promise<GestionResponseDto> {
    return this.gestion.crear(dto);
  }
}
