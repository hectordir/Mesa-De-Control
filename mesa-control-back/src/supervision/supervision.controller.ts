import {
  Body,
  Controller,
  Delete,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../generated/prisma/enums';
import {
  DeleteGestionesDto,
  DeleteGestionesResultDto,
} from './dto/delete-gestiones.dto';
import { SupervisionQueryDto } from './dto/supervision-query.dto';
import { SupervisionResumenDto } from './dto/supervision-resumen.dto';
import { SupervisionService } from './supervision.service';

@ApiTags('supervision')
@ApiBearerAuth('bearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERVISOR)
@ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado' })
@ApiForbiddenResponse({ description: 'Rol sin acceso a Supervisión' })
@Controller('supervision')
export class SupervisionController {
  constructor(private readonly supervision: SupervisionService) {}

  @Get('resumen')
  @ApiOperation({
    summary: 'Resumen consolidado de Supervisión para una fecha de auditoría',
    description:
      'KPIs del día, incidencias por zona, Bandeja N2, SLA por antigüedad, HeatMap y lista de depuración. Una fecha sin datos devuelve 200 con ceros/listas vacías.',
  })
  @ApiOkResponse({ type: SupervisionResumenDto })
  @ApiBadRequestResponse({
    description: 'fecha con formato distinto de YYYY-MM-DD',
  })
  resumen(@Query() query: SupervisionQueryDto): Promise<SupervisionResumenDto> {
    return this.supervision.resumen(query.fecha);
  }

  @Delete('gestiones')
  @ApiOperation({
    summary: 'Depura (borra realmente) las gestiones indicadas',
    description: 'Borrado en bloque. `ids` no puede estar vacío.',
  })
  @ApiOkResponse({ type: DeleteGestionesResultDto })
  @ApiBadRequestResponse({ description: 'ids ausente o vacío' })
  eliminar(
    @Body() body: DeleteGestionesDto,
  ): Promise<DeleteGestionesResultDto> {
    return this.supervision.eliminar(body.ids);
  }
}
