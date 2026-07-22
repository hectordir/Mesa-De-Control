import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { GestionResponseDto } from './dto/gestion-response.dto';
import { ResultadoGestion } from '../generated/prisma/enums';

/** Fila persistida con la relación `operador` incluida. */
type GestionConOperador = {
  id: string;
  operadorId: string;
  resultado: ResultadoGestion;
  motivo: string;
  ubicacion: string;
  fecha: Date;
  createdAt: Date;
  abonado: string;
  telefono: string;
  detalle: string;
  solucion: string;
  tipo: string;
  requiereVisita: boolean;
  observacion: string;
  coordenadas: string | null;
  operador: { id: string; name: string };
};

@Injectable()
export class GestionService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(
    operadorId: string,
    dto: CreateGestionDto,
  ): Promise<GestionResponseDto> {
    const creada = await this.prisma.gestion.create({
      data: {
        operadorId,
        resultado: dto.resultado,
        motivo: dto.motivo,
        // La zona del reporte se persiste en la columna `ubicacion`.
        ubicacion: dto.zona,
        // `@db.Date`: se guarda la medianoche UTC del día, igual que los dashboards.
        fecha: new Date(`${dto.fecha}T00:00:00.000Z`),
        abonado: dto.abonado,
        telefono: dto.telefono,
        detalle: dto.detalle,
        solucion: dto.solucion,
        tipo: dto.tipo ?? '',
        requiereVisita: dto.requiereVisita ?? false,
        observacion: dto.observacion,
        coordenadas: dto.coordenadas ?? null,
      },
      include: { operador: { select: { id: true, name: true } } },
    });

    return GestionService.aResponse(creada);
  }

  private static aResponse(g: GestionConOperador): GestionResponseDto {
    return {
      id: g.id,
      fecha: g.fecha.toISOString().slice(0, 10),
      operador: { id: g.operador.id, nombre: g.operador.name },
      abonado: g.abonado,
      telefono: g.telefono,
      detalle: g.detalle,
      solucion: g.solucion,
      resultado: g.resultado,
      tipo: g.tipo,
      requiereVisita: g.requiereVisita,
      zona: g.ubicacion,
      motivo: g.motivo,
      observacion: g.observacion,
      coordenadas: g.coordenadas ?? null,
      createdAt: g.createdAt.toISOString(),
    };
  }
}
