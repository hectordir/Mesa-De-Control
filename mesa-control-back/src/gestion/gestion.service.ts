import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { GestionResponseDto } from './dto/gestion-response.dto';
import {
  ListGestionesQueryDto,
  SortDir,
  SortKey,
} from './dto/list-gestiones-query.dto';
import {
  GestionesListResponseDto,
  GestionListItemDto,
} from './dto/gestiones-list-response.dto';
import { CanalGestion, ResultadoGestion } from '../generated/prisma/enums';

/** Los 5 resultados, para rellenar `counts.porResultado` con ceros. */
const RESULTADOS: ResultadoGestion[] = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
];

/**
 * Código legible `GST-#####` derivado del id de forma estable y determinista:
 * hash FNV-1a 32-bit del id proyectado al rango 10000–99999 (5 dígitos). No
 * cambia entre requests y no depende de una secuencia de BD.
 */
export function codigoDeId(id: string): string {
  let h = 0x811c9dc5;
  for (const char of id) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  const n = 10000 + ((h >>> 0) % 90000);
  return `GST-${n}`;
}

/** Iniciales del nombre: primera letra de las dos primeras palabras. */
function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Fila del listado (findMany con la relación `operador`). */
type GestionListRow = {
  id: string;
  resultado: ResultadoGestion;
  ubicacion: string;
  fecha: Date;
  createdAt: Date;
  abonado: string;
  telefono: string;
  detalle: string;
  solucion: string;
  canal: CanalGestion | null;
  duracion: number | null;
  operador: { id: string; name: string };
};

type ConteoPorResultado = {
  resultado: ResultadoGestion;
  _count: { _all: number };
};

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

  async crear(dto: CreateGestionDto): Promise<GestionResponseDto> {
    // La autoría viaja en el body (§9.1): debe existir y tener rol OPERADOR.
    const operador = await this.prisma.user.findUnique({
      where: { id: dto.operadorId },
      select: { id: true, role: true },
    });
    if (!operador || operador.role !== 'OPERADOR') {
      throw new BadRequestException(
        'operadorId debe referenciar un usuario con rol OPERADOR',
      );
    }

    const creada = await this.prisma.gestion.create({
      data: {
        operadorId: dto.operadorId,
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

  /** Listado paginado del Historial General. Todo se resuelve en Postgres. */
  async listar(q: ListGestionesQueryDto): Promise<GestionesListResponseDto> {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 10;
    const sortKey: SortKey = q.sortKey ?? 'fecha';
    const sortDir: SortDir = q.sortDir ?? 'desc';

    // `whereBase` = filtros comunes SIN `resultado`: alimenta los counts (chips).
    const whereBase = GestionService.whereBase(q);
    // `whereFull` añade el filtro `resultado` para el listado y su total.
    const whereFull = q.resultado
      ? { ...whereBase, resultado: q.resultado }
      : whereBase;

    const [rows, total, countTotal, porResultado] = await Promise.all([
      this.prisma.gestion.findMany({
        where: whereFull,
        orderBy: GestionService.orderBy(sortKey, sortDir),
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          resultado: true,
          ubicacion: true,
          fecha: true,
          createdAt: true,
          abonado: true,
          telefono: true,
          detalle: true,
          solucion: true,
          canal: true,
          duracion: true,
          operador: { select: { id: true, name: true } },
        },
      }) as unknown as Promise<GestionListRow[]>,
      this.prisma.gestion.count({ where: whereFull }),
      this.prisma.gestion.count({ where: whereBase }),
      this.prisma.gestion.groupBy({
        by: ['resultado'],
        where: whereBase,
        _count: { _all: true },
      }) as unknown as Promise<ConteoPorResultado[]>,
    ]);

    return {
      items: rows.map((r) => GestionService.aItem(r)),
      total,
      page,
      pageSize,
      counts: {
        total: countTotal,
        porResultado: GestionService.porResultado(porResultado),
      },
    };
  }

  /** Filtros de búsqueda y rango de fechas (sin `resultado`). */
  private static whereBase(q: ListGestionesQueryDto): Record<string, unknown> {
    const where: Record<string, unknown> = {};

    if (q.search) {
      const contains = { contains: q.search, mode: 'insensitive' } as const;
      where.OR = [
        { abonado: contains },
        { telefono: contains },
        { operador: { name: contains } },
      ];
    }

    if (q.desde || q.hasta) {
      const fecha: { gte?: Date; lte?: Date } = {};
      if (q.desde) fecha.gte = new Date(`${q.desde}T00:00:00.000Z`);
      if (q.hasta) fecha.lte = new Date(`${q.hasta}T00:00:00.000Z`);
      where.fecha = fecha;
    }

    return where;
  }

  /** Orden en Postgres, con desempate estable por `id`. */
  private static orderBy(
    sortKey: SortKey,
    dir: SortDir,
  ): Record<string, unknown>[] {
    const tie = { id: 'asc' as const };
    switch (sortKey) {
      case 'operador':
        return [{ operador: { name: dir } }, tie];
      case 'abonado':
        return [{ abonado: dir }, tie];
      case 'resultado':
        return [{ resultado: dir }, tie];
      case 'zona':
        return [{ ubicacion: dir }, tie];
      case 'fecha':
      default:
        return [{ fecha: dir }, { createdAt: dir }, tie];
    }
  }

  private static porResultado(
    filas: ConteoPorResultado[],
  ): Record<ResultadoGestion, number> {
    const por = new Map(filas.map((f) => [f.resultado, f._count._all]));
    return RESULTADOS.reduce(
      (acc, r) => {
        acc[r] = por.get(r) ?? 0;
        return acc;
      },
      {} as Record<ResultadoGestion, number>,
    );
  }

  private static aItem(g: GestionListRow): GestionListItemDto {
    return {
      id: g.id,
      codigo: codigoDeId(g.id),
      operador: {
        id: g.operador.id,
        nombre: g.operador.name,
        iniciales: iniciales(g.operador.name),
      },
      abonado: g.abonado,
      telefono: g.telefono,
      zona: g.ubicacion,
      canal: g.canal,
      resultado: g.resultado,
      fecha: g.fecha.toISOString().slice(0, 10),
      hora: g.createdAt.toISOString().slice(11, 16),
      duracionMin: g.duracion,
      detalle: g.detalle,
      solucion: g.solucion,
    };
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
