import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OperadorOptionDto } from './dto/operador-option.dto';
import { OperadoresService } from './operadores.service';

@ApiTags('operadores')
@Controller('operadores')
export class OperadoresController {
  constructor(private readonly operadores: OperadoresService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Lista los operadores (rol OPERADOR) para el select de registro',
    description:
      'Ordenados por nombre. Alimenta el select de autoría de /registro.',
  })
  @ApiOkResponse({ type: OperadorOptionDto, isArray: true })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  listar(): Promise<OperadorOptionDto[]> {
    return this.operadores.listar();
  }
}
