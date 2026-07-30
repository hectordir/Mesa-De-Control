import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { UpdateGestionDto } from './dto/update-gestion.dto';
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
import {
  formatFechaVE,
  formatHora12VE,
  formatHoraVE,
} from '../common/time/index';

/** Los 5 resultados, para rellenar `counts.porResultado` con ceros. */
const RESULTADOS: ResultadoGestion[] = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
];

/**
 * Código legible `LG-#####` derivado del id de forma estable y determinista:
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
  return `LG-${n}`;
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
  nombreCliente: string;
  telefono: string;
  detalle: string;
  solucion: string;
  canal: CanalGestion | null;
  duracion: number | null;
  operador: { id: string; name: string };
  updatedAt: Date | null;
  /** FK `ON DELETE SET NULL`: puede haber `updatedAt` sin editor. */
  editor: { id: string; name: string } | null;
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
  nombreCliente: string;
  telefono: string;
  detalle: string;
  solucion: string;
  tipo: string;
  requiereVisita: boolean;
  observacion: string;
  coordenadas: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
  operador: { id: string; name: string };
};

/** Relación `operador` que necesita `aResponse`. */
const INCLUDE_OPERADOR = {
  operador: { select: { id: true, name: true } },
} as const;

@Injectable()
export class GestionService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(dto: CreateGestionDto): Promise<GestionResponseDto> {
    // La autoría viaja en el body (§9.1): debe existir y tener rol OPERADOR.
    await this.exigirOperador(dto.operadorId);

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
        nombreCliente: dto.nombreCliente,
        telefono: dto.telefono,
        detalle: dto.detalle,
        solucion: dto.solucion,
        tipo: dto.tipo ?? '',
        requiereVisita: dto.requiereVisita ?? false,
        // Opcional en la API: el default '' de Prisma cubre su ausencia.
        observacion: dto.observacion ?? '',
        coordenadas: dto.coordenadas ?? null,
      },
      include: INCLUDE_OPERADOR,
    });

    return GestionService.aResponse(creada);
  }

  /** Detalle completo de una gestión (precarga del modal de edición). */
  async obtener(id: string): Promise<GestionResponseDto> {
    const gestion = (await this.prisma.gestion.findUnique({
      where: { id },
      include: INCLUDE_OPERADOR,
    })) as GestionConOperador | null;

    if (!gestion) throw new NotFoundException(`Gestión ${id} no encontrada`);
    return GestionService.aResponse(gestion);
  }

  /**
   * Edición parcial. `id` y `createdAt` son inmutables; la auditoría
   * (`updatedAt`/`updatedBy`) la sella el service con el usuario del token,
   * nunca con datos del body.
   */
  async actualizar(
    id: string,
    dto: UpdateGestionDto,
    editorId: string,
  ): Promise<GestionResponseDto> {
    const existe = await this.prisma.gestion.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existe) throw new NotFoundException(`Gestión ${id} no encontrada`);

    // Reasignar operador exige la misma validación que el alta.
    if (dto.operadorId !== undefined) await this.exigirOperador(dto.operadorId);

    const actualizada = await this.prisma.gestion.update({
      where: { id },
      data: {
        ...GestionService.cambios(dto),
        updatedAt: new Date(),
        updatedBy: editorId,
      },
      include: INCLUDE_OPERADOR,
    });

    return GestionService.aResponse(actualizada);
  }

  /** Solo los campos presentes en el body, ya mapeados a columnas. */
  private static cambios(dto: UpdateGestionDto): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    const set = (col: string, valor: unknown) => {
      if (valor !== undefined) data[col] = valor;
    };

    set('operadorId', dto.operadorId);
    set('resultado', dto.resultado);
    set('motivo', dto.motivo);
    // La zona del reporte vive en la columna `ubicacion`.
    set('ubicacion', dto.zona);
    if (dto.fecha !== undefined) {
      data.fecha = new Date(`${dto.fecha}T00:00:00.000Z`);
    }
    set('abonado', dto.abonado);
    set('nombreCliente', dto.nombreCliente);
    set('telefono', dto.telefono);
    set('detalle', dto.detalle);
    set('solucion', dto.solucion);
    set('tipo', dto.tipo);
    set('requiereVisita', dto.requiereVisita);
    set('observacion', dto.observacion);
    // `coordenadas: null` sí es un cambio legítimo (borrar el pin).
    set('coordenadas', dto.coordenadas);

    return data;
  }

  /** 400 si el id no existe o el usuario no tiene rol OPERADOR. */
  private async exigirOperador(operadorId: string): Promise<void> {
    const operador = await this.prisma.user.findUnique({
      where: { id: operadorId },
      select: { id: true, role: true },
    });
    if (!operador || operador.role !== 'OPERADOR') {
      throw new BadRequestException(
        'operadorId debe referenciar un usuario con rol OPERADOR',
      );
    }
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
          nombreCliente: true,
          telefono: true,
          detalle: true,
          solucion: true,
          canal: true,
          duracion: true,
          operador: { select: { id: true, name: true } },
          updatedAt: true,
          editor: { select: { id: true, name: true } },
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
        { nombreCliente: contains },
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
      case 'nombreCliente':
        return [{ nombreCliente: dir }, tie];
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
      nombreCliente: g.nombreCliente,
      telefono: g.telefono,
      zona: g.ubicacion,
      canal: g.canal,
      resultado: g.resultado,
      // `fecha` es `@db.Date` (medianoche UTC, sin hora): se emite tal cual.
      // Pasarla por el helper de zona la retrasaría un día entero.
      fecha: g.fecha.toISOString().slice(0, 10),
      // `createdAt`/`updatedAt` sí son instantes: van en hora de Caracas.
      hora: formatHoraVE(g.createdAt),
      duracionMin: g.duracion,
      detalle: g.detalle,
      solucion: g.solucion,
      // Auditoría: null si nunca se editó. El editor puede faltar aunque haya
      // `updatedAt` (FK `ON DELETE SET NULL`), y eso no anula la fecha.
      modificadaFecha: g.updatedAt ? formatFechaVE(g.updatedAt) : null,
      modificadaHora: g.updatedAt ? formatHora12VE(g.updatedAt) : null,
      editor: g.editor ? { id: g.editor.id, nombre: g.editor.name } : null,
    };
  }

  private static aResponse(g: GestionConOperador): GestionResponseDto {
    return {
      id: g.id,
      codigo: codigoDeId(g.id),
      // `@db.Date`: día calendario puro, NO se convierte de zona.
      fecha: g.fecha.toISOString().slice(0, 10),
      operador: { id: g.operador.id, nombre: g.operador.name },
      abonado: g.abonado,
      nombreCliente: g.nombreCliente,
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
      updatedAt: g.updatedAt ? g.updatedAt.toISOString() : null,
      updatedBy: g.updatedBy ?? null,
    };
  }
}
