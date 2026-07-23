import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { EstadoAtencion } from '../../generated/prisma/enums';
import {
  CANALES,
  ESTADOS,
  MOTIVOS,
  ORIGENES,
  SOLUCIONES,
  origenDeMotivo,
} from './catalogos';
import { CrearAtencionDto } from './dto/crear-atencion.dto';
import {
  GestionResumenDto,
  OrigenItemDto,
  RegistroAtencionDto,
  TopCanalItemDto,
} from './dto/gestion-resumen.dto';

const TOP_CANALES = 5;

type ConteoPorEstado = { estado: EstadoAtencion; _count: { _all: number } };
type ConteoPorCanal = { canal: string; _count: { _all: number } };
type ConteoPorMotivo = { motivo: string; _count: { _all: number } };
type AtencionConOperador = {
  id: string;
  abonado: string;
  canal: string;
  motivo: string;
  solucion: string;
  estado: EstadoAtencion;
  creadoEn: Date;
  operador: { name: string };
};

@Injectable()
export class GestionAppService {
  constructor(private readonly prisma: PrismaService) {}

  async resumen(): Promise<GestionResumenDto> {
    const [total, porEstado, porCanal, porMotivo, registros] =
      await Promise.all([
        this.prisma.atencionApp.count(),
        this.prisma.atencionApp.groupBy({
          by: ['estado'],
          _count: { _all: true },
        }) as unknown as Promise<ConteoPorEstado[]>,
        this.prisma.atencionApp.groupBy({
          by: ['canal'],
          _count: { _all: true },
          orderBy: [{ _count: { canal: 'desc' } }, { canal: 'asc' }],
          take: TOP_CANALES,
        }) as unknown as Promise<ConteoPorCanal[]>,
        this.prisma.atencionApp.groupBy({
          by: ['motivo'],
          _count: { _all: true },
        }) as unknown as Promise<ConteoPorMotivo[]>,
        this.prisma.atencionApp.findMany({
          orderBy: { creadoEn: 'desc' },
          select: {
            id: true,
            abonado: true,
            canal: true,
            motivo: true,
            solucion: true,
            estado: true,
            creadoEn: true,
            operador: { select: { name: true } },
          },
        }) as unknown as Promise<AtencionConOperador[]>,
      ]);

    return {
      kpis: GestionAppService.kpis(total, porEstado),
      topCanales: GestionAppService.topCanales(porCanal),
      origen: GestionAppService.origen(porMotivo),
      registros: registros.map((r) => GestionAppService.aRegistro(r)),
      catalogos: {
        canales: [...CANALES],
        motivos: [...MOTIVOS],
        soluciones: [...SOLUCIONES],
        estados: [...ESTADOS],
      },
    };
  }

  async crear(dto: CrearAtencionDto): Promise<RegistroAtencionDto> {
    const operador = await this.prisma.user.findUnique({
      where: { id: dto.operadorId },
      select: { id: true },
    });
    if (!operador) {
      throw new BadRequestException(
        'operadorId debe referenciar un usuario existente',
      );
    }

    const creada = await this.prisma.atencionApp.create({
      data: {
        operadorId: dto.operadorId,
        abonado: dto.abonado,
        canal: dto.canal,
        motivo: dto.motivo,
        solucion: dto.solucion,
        estado: dto.estado,
      },
      select: {
        id: true,
        abonado: true,
        canal: true,
        motivo: true,
        solucion: true,
        estado: true,
        creadoEn: true,
        operador: { select: { name: true } },
      },
    });

    return GestionAppService.aRegistro(creada);
  }

  private static kpis(
    total: number,
    filas: ConteoPorEstado[],
  ): GestionResumenDto['kpis'] {
    const por = new Map(filas.map((f) => [f.estado, f._count._all]));
    return {
      totalAtendidos: total,
      solucionados: por.get('SOLUCIONADO') ?? 0,
      enProceso: por.get('EN_PROCESO') ?? 0,
      escalados: por.get('ESCALADO') ?? 0,
    };
  }

  private static topCanales(filas: ConteoPorCanal[]): TopCanalItemDto[] {
    // Ya vienen ordenadas y cortadas por la base; se reafirma el orden por robustez.
    return filas
      .map((f) => ({ canal: f.canal, total: f._count._all }))
      .sort((a, b) => b.total - a.total || a.canal.localeCompare(b.canal))
      .slice(0, TOP_CANALES);
  }

  private static origen(filas: ConteoPorMotivo[]): OrigenItemDto[] {
    const acumulado = new Map<string, number>();
    for (const f of filas) {
      const origen = origenDeMotivo(f.motivo);
      if (!origen) continue;
      acumulado.set(origen, (acumulado.get(origen) ?? 0) + f._count._all);
    }
    // Orden fijo del catálogo; solo categorías con total > 0.
    return ORIGENES.map((origen) => ({
      origen,
      total: acumulado.get(origen) ?? 0,
    })).filter((o) => o.total > 0);
  }

  private static aRegistro(a: AtencionConOperador): RegistroAtencionDto {
    return {
      id: a.id,
      operador: a.operador.name,
      abonado: a.abonado,
      canal: a.canal,
      motivo: a.motivo,
      solucion: a.solucion,
      estado: a.estado,
      creadoEn: a.creadoEn.toISOString(),
    };
  }
}
