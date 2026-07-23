import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CrearAtencionDto } from './dto/crear-atencion.dto';
import {
  GestionResumenDto,
  RegistroAtencionDto,
} from './dto/gestion-resumen.dto';
import { GestionAppService } from './gestion-app.service';

@ApiTags('fibex-play · gestión')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('fibex-play/gestion')
export class GestionAppController {
  constructor(private readonly service: GestionAppService) {}

  @Get()
  @ApiOperation({
    summary: 'Resumen de la bitácora de atención App Fibex',
    description:
      'KPIs por estado, Top Canales (desc, top 5), Origen del Problema (derivado ' +
      'del motivo), registros (desc por creadoEn) y catálogos. Nunca 404: sin ' +
      'datos → 0 y arrays vacíos, catálogos siempre presentes. Requiere JWT.',
  })
  @ApiOkResponse({ type: GestionResumenDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  resumen(): Promise<GestionResumenDto> {
    return this.service.resumen();
  }

  @Post()
  @ApiOperation({
    summary: 'Registra una nueva atención en la bitácora',
    description:
      'canal/motivo/solucion se validan contra el catálogo; estado contra el ' +
      'enum. operadorId debe existir (si no, 400). Devuelve el registro creado.',
  })
  @ApiCreatedResponse({ type: RegistroAtencionDto })
  @ApiBadRequestResponse({
    description:
      'Body inválido, valor fuera de catálogo u operadorId inexistente',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  crear(@Body() dto: CrearAtencionDto): Promise<RegistroAtencionDto> {
    return this.service.crear(dto);
  }
}
