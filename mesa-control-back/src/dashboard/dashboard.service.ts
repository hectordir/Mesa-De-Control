import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ResultadoGestion } from '../generated/prisma/enums';
import {
  ActividadItemDto,
  AveriaItemDto,
  DistribucionItemDto,
  MonitorDiarioResumenDto,
  OperadorResumenDto,
} from './dto/monitor-diario-resumen.dto';

/** Orden fijo de la leyenda del donut: no depende de los datos del día. */
const RESULTADOS: ResultadoGestion[] = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
];

const TOP_AVERIAS = 5;
const ACTIVIDAD_RECIENTE = 20;

/** Filas de `groupBy` tipadas mínimamente: solo se usa `_count._all`. */
type ConteoPorResultado = {
  resultado: ResultadoGestion;
  _count: { _all: number };
};
type ConteoPorOperador = ConteoPorResultado & { operadorId: string };
type ConteoPorMotivo = { motivo: string; _count: { _all: number } };
type GestionReciente = {
  id: string;
  resultado: ResultadoGestion;
  ubicacion: string;
  createdAt: Date;
  operador: { name: string };
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Día de hoy en la zona del servidor, como `YYYY-MM-DD`. */
  private static hoy(): string {
    const now = new Date();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${mes}-${dia}`;
  }

  async monitorDiario(fecha?: string): Promise<MonitorDiarioResumenDto> {
    const dia = fecha ?? DashboardService.hoy();
    // La columna es `@db.Date`: se compara contra la medianoche UTC de ese día.
    const where = { fecha: new Date(`${dia}T00:00:00.000Z`) };

    // Las cuatro agregaciones las resuelve Postgres; aquí solo se da forma al DTO.
    const [porResultado, porOperador, porMotivo, recientes] = await Promise.all(
      [
        this.prisma.gestion.groupBy({
          by: ['resultado'],
          where,
          _count: { _all: true },
        }) as unknown as Promise<ConteoPorResultado[]>,
        this.prisma.gestion.groupBy({
          by: ['operadorId', 'resultado'],
          where,
          _count: { _all: true },
        }) as unknown as Promise<ConteoPorOperador[]>,
        this.prisma.gestion.groupBy({
          by: ['motivo'],
          where,
          _count: { _all: true },
          orderBy: [{ _count: { motivo: 'desc' } }, { motivo: 'asc' }],
          take: TOP_AVERIAS,
        }) as unknown as Promise<ConteoPorMotivo[]>,
        this.prisma.gestion.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: ACTIVIDAD_RECIENTE,
          select: {
            id: true,
            resultado: true,
            ubicacion: true,
            createdAt: true,
            operador: { select: { name: true } },
          },
        }) as unknown as Promise<GestionReciente[]>,
      ],
    );

    return {
      fecha: dia,
      kpis: DashboardService.kpis(porResultado),
      operadores: await this.operadores(porOperador),
      distribucion: DashboardService.distribucion(porResultado),
      topAverias: DashboardService.topAverias(porMotivo),
      actividad: DashboardService.actividad(recientes),
    };
  }

  private static totalPorResultado(
    filas: ConteoPorResultado[],
  ): Map<ResultadoGestion, number> {
    return new Map(filas.map((f) => [f.resultado, f._count._all]));
  }

  private static kpis(
    filas: ConteoPorResultado[],
  ): MonitorDiarioResumenDto['kpis'] {
    const por = DashboardService.totalPorResultado(filas);
    const total = filas.reduce((suma, f) => suma + f._count._all, 0);
    const mesa = por.get('SOLUCIONADO_MESA') ?? 0;

    return {
      clientesAtendidos: total,
      efectividadMesa: total === 0 ? 0 : Math.round((mesa / total) * 100),
      enviadoSoporte2: por.get('ENVIADO_SOPORTE2') ?? 0,
      escaladoNoc: por.get('ESCALADO_NOC') ?? 0,
      pendienteCliente: por.get('PENDIENTE_CLIENTE') ?? 0,
    };
  }

  private static distribucion(
    filas: ConteoPorResultado[],
  ): DistribucionItemDto[] {
    const por = DashboardService.totalPorResultado(filas);
    // Los resultados sin gestiones también viajan, en 0: la leyenda no cambia de tamaño.
    return RESULTADOS.map((resultado) => ({
      resultado,
      total: por.get(resultado) ?? 0,
    }));
  }

  private async operadores(
    filas: ConteoPorOperador[],
  ): Promise<OperadorResumenDto[]> {
    if (filas.length === 0) return [];

    const acumulado = new Map<string, Omit<OperadorResumenDto, 'nombre'>>();
    for (const fila of filas) {
      const actual = acumulado.get(fila.operadorId) ?? {
        id: fila.operadorId,
        clientes: 0,
        mesa: 0,
        soporte2: 0,
        noc: 0,
      };
      const n = fila._count._all;
      actual.clientes += n;
      if (fila.resultado === 'SOLUCIONADO_MESA') actual.mesa += n;
      if (fila.resultado === 'ENVIADO_SOPORTE2') actual.soporte2 += n;
      if (fila.resultado === 'ESCALADO_NOC') actual.noc += n;
      acumulado.set(fila.operadorId, actual);
    }

    const usuarios = await this.prisma.user.findMany({
      where: { id: { in: [...acumulado.keys()] } },
      select: { id: true, name: true },
    });
    const nombres = new Map(usuarios.map((u) => [u.id, u.name]));

    return [...acumulado.values()]
      .map(({ id, clientes, mesa, soporte2, noc }) => ({
        id,
        nombre: nombres.get(id) ?? '—',
        clientes,
        mesa,
        soporte2,
        noc,
      }))
      .sort(
        (a, b) => b.clientes - a.clientes || a.nombre.localeCompare(b.nombre),
      );
  }

  private static topAverias(filas: ConteoPorMotivo[]): AveriaItemDto[] {
    // Ya vienen ordenadas y cortadas por la base.
    return filas.map((f) => ({ motivo: f.motivo, total: f._count._all }));
  }

  private static actividad(filas: GestionReciente[]): ActividadItemDto[] {
    return filas.map((g) => ({
      id: g.id,
      operador: g.operador.name,
      resultado: g.resultado,
      ubicacion: g.ubicacion,
      hora: g.createdAt.toISOString(),
    }));
  }
}
