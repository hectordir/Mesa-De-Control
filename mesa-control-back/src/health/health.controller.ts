import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

/** Respuesta del healthcheck. */
export interface HealthStatus {
  status: 'ok';
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Liveness para el balanceador de Railway: público, sin JWT y sin tocar la base
   * (una caída de Postgres no debe reciclar el contenedor en bucle).
   */
  @Get()
  @ApiOperation({ summary: 'Healthcheck público del servicio' })
  @ApiOkResponse({ schema: { example: { status: 'ok' } } })
  check(): HealthStatus {
    return { status: 'ok' };
  }
}
