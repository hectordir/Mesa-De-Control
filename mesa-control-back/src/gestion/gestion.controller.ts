import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '../generated/prisma/enums';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { UpdateGestionDto } from './dto/update-gestion.dto';
import { GestionResponseDto } from './dto/gestion-response.dto';
import { ListGestionesQueryDto } from './dto/list-gestiones-query.dto';
import { GestionesListResponseDto } from './dto/gestiones-list-response.dto';
import { GestionService } from './gestion.service';

@ApiTags('gestiones')
@Controller('gestiones')
export class GestionController {
  constructor(private readonly gestion: GestionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: 'Listado paginado del Historial General',
    description:
      'Filtra (search, rango de fechas, resultado), ordena y pagina en ' +
      'Postgres. `counts.porResultado` se calcula sobre el mismo filtro salvo ' +
      '`resultado`, para que las chips muestren el total de cada categoría. ' +
      'Requiere JWT.',
  })
  @ApiOkResponse({ type: GestionesListResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  listar(
    @Query() query: ListGestionesQueryDto,
  ): Promise<GestionesListResponseDto> {
    return this.gestion.listar(query);
  }

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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Detalle completo de una gestión',
    description:
      'Devuelve todos los campos del formulario de registro (incluidos `tipo`, ' +
      '`motivo`, `observacion`, `requiereVisita` y `coordenadas`, ausentes en la ' +
      'fila del listado) más el `codigo` LG-#####. Requiere JWT.',
  })
  @ApiOkResponse({ type: GestionResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  @ApiNotFoundResponse({ description: 'No existe una gestión con ese id' })
  obtener(@Param('id') id: string): Promise<GestionResponseDto> {
    return this.gestion.obtener(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  @ApiBearerAuth('bearerAuth')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOperation({
    summary: 'Edita una gestión existente (solo ADMIN y SUPERVISOR)',
    description:
      'Edición parcial. `operadorId` es editable con la misma validación que el ' +
      'alta (400 si el destino no tiene rol OPERADOR). `id` y `createdAt` (y con ' +
      'ellos `codigo` y `hora`) son inmutables. La auditoría `updatedAt`/' +
      '`updatedBy` la escribe el servidor con el usuario del token.',
  })
  @ApiOkResponse({ type: GestionResponseDto })
  @ApiBadRequestResponse({
    description:
      'Body inválido, campo obligatorio vacío u operadorId sin rol OPERADOR',
  })
  @ApiUnauthorizedResponse({
    description: 'Token ausente, inválido o expirado',
  })
  @ApiForbiddenResponse({ description: 'Rol sin permiso para editar' })
  @ApiNotFoundResponse({ description: 'No existe una gestión con ese id' })
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateGestionDto,
    @Req() req: { user: { id: string } },
  ): Promise<GestionResponseDto> {
    // La autoría de la edición sale SIEMPRE del token, nunca del body.
    return this.gestion.actualizar(id, dto, req.user.id);
  }
}
