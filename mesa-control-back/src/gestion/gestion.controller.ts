import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PublicUserDto } from '../auth/dto/public-user.dto';
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
      'El operadorId se toma del token (req.user), nunca del body. La zona se ' +
      'persiste en la columna `ubicacion` y alimenta los dashboards del mismo día/mes.',
  })
  @ApiCreatedResponse({ type: GestionResponseDto })
  @ApiBadRequestResponse({
    description: 'Body inválido o campo obligatorio ausente',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  crear(
    @Req() req: Request,
    @Body() dto: CreateGestionDto,
  ): Promise<GestionResponseDto> {
    const operador = req.user as PublicUserDto;
    return this.gestion.crear(operador.id, dto);
  }
}
