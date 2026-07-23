import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FibexPlayService } from './fibex-play.service';
import { FibexPlayResumenDto } from './dto/fibex-play-resumen.dto';

@ApiTags('fibex-play')
@Controller('fibex-play')
export class FibexPlayController {
  constructor(private readonly fibexPlay: FibexPlayService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Snapshot en vivo de la grilla de canales TV/streaming',
    description:
      'Sin canales devuelve 200 con el estado vacío (total 0, saludGrilla 100, arrays vacíos), nunca 404.',
  })
  @ApiOkResponse({ type: FibexPlayResumenDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  grilla(): Promise<FibexPlayResumenDto> {
    return this.fibexPlay.grilla();
  }
}
