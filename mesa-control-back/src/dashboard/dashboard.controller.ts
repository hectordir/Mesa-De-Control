import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { MonitorDiarioQueryDto } from './dto/monitor-diario-query.dto';
import { MonitorDiarioResumenDto } from './dto/monitor-diario-resumen.dto';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('monitor-diario')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Resumen del Monitor Diario para un día de operación',
    description:
      'Un día sin gestiones devuelve 200 con los KPIs en 0 y las listas vacías (estado vacío del front), nunca 404.',
  })
  @ApiOkResponse({ type: MonitorDiarioResumenDto })
  @ApiBadRequestResponse({
    description: 'fecha con formato distinto de YYYY-MM-DD',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  monitorDiario(
    @Query() query: MonitorDiarioQueryDto,
  ): Promise<MonitorDiarioResumenDto> {
    return this.dashboard.monitorDiario(query.fecha);
  }
}
