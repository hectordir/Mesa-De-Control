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
import {
  AnalisisMensualBarDto,
  AnalisisMensualDiaDto,
  AnalisisMensualDto,
  AnalisisMensualHeatmapDto,
  AnalisisMensualMotivoDto,
  AnalisisMensualOperadorDto,
} from './dto/analisis-mensual.dto';

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

/** Columnas del heatmap del Análisis Mensual. */
const TOP_MOTIVOS_MES = 6;
/** Meses que se comparan en el gráfico de barras (el pedido y los 3 previos). */
const MESES_SERIE = 4;
/** Meta de efectividad del equipo: constante de negocio, no sale de los datos. */
const META_EFECTIVIDAD = 65;

const NOMBRE_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/** Filas de `groupBy` tipadas mínimamente: solo se usa `_count._all`. */
type ConteoPorResultado = {
  resultado: ResultadoGestion;
  _count: { _all: number };
};
type ConteoPorOperador = ConteoPorResultado & { operadorId: string };
type ConteoPorMotivo = { motivo: string; _count: { _all: number } };
type ConteoPorDia = ConteoPorResultado & { fecha: Date };
type ConteoPorFecha = { fecha: Date; _count: { _all: number } };
type ConteoPorZona = ConteoPorMotivo & { ubicacion: string };
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

  /* ── Análisis Mensual ─────────────────────────────────────────────────── */

  /** Mes en curso en la zona del servidor, como `YYYY-MM`. */
  private static mesActual(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /** Medianoche UTC del día 1 de `periodo` desplazado `delta` meses. */
  private static inicioDeMes(periodo: string, delta = 0): Date {
    const [anio, mes] = periodo.split('-').map(Number);
    return new Date(Date.UTC(anio, mes - 1 + delta, 1));
  }

  private static periodoDe(fecha: Date): string {
    return fecha.toISOString().slice(0, 7);
  }

  async analisisMensual(periodo?: string): Promise<AnalisisMensualDto> {
    const mes = periodo ?? DashboardService.mesActual();
    // Rango semiabierto: sirve igual para meses de 28, 30 o 31 días.
    const delMes = {
      fecha: {
        gte: DashboardService.inicioDeMes(mes),
        lt: DashboardService.inicioDeMes(mes, 1),
      },
    };
    const deLaSerie = {
      fecha: {
        gte: DashboardService.inicioDeMes(mes, 1 - MESES_SERIE),
        lt: DashboardService.inicioDeMes(mes, 1),
      },
    };

    const [
      porResultado,
      porDia,
      topMotivos,
      distribucion,
      porOperador,
      porDiaTotal,
    ] = await Promise.all([
      this.prisma.gestion.groupBy({
        by: ['resultado'],
        where: delMes,
        _count: { _all: true },
      }) as unknown as Promise<ConteoPorResultado[]>,
      // Un conteo por día y resultado: Postgres agrega, aquí solo se suman
      // los ~120 subtotales por mes. Nunca se traen gestiones a memoria.
      this.prisma.gestion.groupBy({
        by: ['fecha', 'resultado'],
        where: deLaSerie,
        _count: { _all: true },
      }) as unknown as Promise<ConteoPorDia[]>,
      this.prisma.gestion.groupBy({
        by: ['motivo'],
        where: delMes,
        _count: { _all: true },
        orderBy: [{ _count: { motivo: 'desc' } }, { motivo: 'asc' }],
        take: TOP_MOTIVOS_MES,
      }) as unknown as Promise<ConteoPorMotivo[]>,
      // Distribución: TODOS los motivos del mes (sin `take`), desc por _count.
      this.prisma.gestion.groupBy({
        by: ['motivo'],
        where: delMes,
        _count: { _all: true },
        orderBy: [{ _count: { motivo: 'desc' } }, { motivo: 'asc' }],
      }) as unknown as Promise<ConteoPorMotivo[]>,
      this.prisma.gestion.groupBy({
        by: ['operadorId', 'resultado'],
        where: delMes,
        _count: { _all: true },
      }) as unknown as Promise<ConteoPorOperador[]>,
      this.prisma.gestion.groupBy({
        by: ['fecha'],
        where: delMes,
        _count: { _all: true },
        orderBy: { fecha: 'asc' },
      }) as unknown as Promise<ConteoPorFecha[]>,
    ]);

    const motivos = topMotivos.map((m) => m.motivo);
    // La matriz solo se pide si hay columnas que llenar.
    const porZona =
      motivos.length === 0
        ? []
        : ((await this.prisma.gestion.groupBy({
            by: ['ubicacion', 'motivo'],
            where: { ...delMes, motivo: { in: motivos } },
            _count: { _all: true },
          })) as unknown as ConteoPorZona[]);

    const por = DashboardService.totalPorResultado(porResultado);

    return {
      periodo: mes,
      kpis: {
        volumen: porResultado.reduce((suma, f) => suma + f._count._all, 0),
        resueltos: por.get('SOLUCIONADO_MESA') ?? 0,
        escalados: por.get('ESCALADO_NOC') ?? 0,
        metaEfectividad: META_EFECTIVIDAD,
      },
      serie: DashboardService.serie(mes, porDia),
      heatmap: DashboardService.heatmap(motivos, porZona),
      distribucion: DashboardService.distribucionMensual(distribucion),
      operadores: await this.operadoresMensual(porOperador),
      tendencia: DashboardService.tendencia(porDiaTotal),
    };
  }

  private static distribucionMensual(
    filas: ConteoPorMotivo[],
  ): AnalisisMensualMotivoDto[] {
    // Ya vienen ordenadas por la base; el orden se reafirma por robustez.
    return filas
      .map((f) => ({ motivo: f.motivo, total: f._count._all }))
      .sort((a, b) => b.total - a.total || a.motivo.localeCompare(b.motivo));
  }

  private async operadoresMensual(
    filas: ConteoPorOperador[],
  ): Promise<AnalisisMensualOperadorDto[]> {
    if (filas.length === 0) return [];

    const acumulado = new Map<
      string,
      Omit<AnalisisMensualOperadorDto, 'nombre'>
    >();
    for (const fila of filas) {
      const actual = acumulado.get(fila.operadorId) ?? {
        id: fila.operadorId,
        solucionados: 0,
        enviadosN2: 0,
        total: 0,
      };
      const n = fila._count._all;
      actual.total += n;
      if (fila.resultado === 'SOLUCIONADO_MESA') actual.solucionados += n;
      if (fila.resultado === 'ENVIADO_SOPORTE2') actual.enviadosN2 += n;
      acumulado.set(fila.operadorId, actual);
    }

    const usuarios = await this.prisma.user.findMany({
      where: { id: { in: [...acumulado.keys()] } },
      select: { id: true, name: true },
    });
    const nombres = new Map(usuarios.map((u) => [u.id, u.name]));

    return [...acumulado.values()]
      .map(({ id, solucionados, enviadosN2, total }) => ({
        id,
        nombre: nombres.get(id) ?? '—',
        solucionados,
        enviadosN2,
        total,
      }))
      .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre));
  }

  private static tendencia(filas: ConteoPorFecha[]): AnalisisMensualDiaDto[] {
    return filas
      .map((f) => ({
        fecha: f.fecha.toISOString().slice(0, 10),
        atendidos: f._count._all,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  private static serie(
    mes: string,
    filas: ConteoPorDia[],
  ): AnalisisMensualBarDto[] {
    const acumulado = new Map<string, { resueltas: number; resto: number }>();
    for (const fila of filas) {
      const clave = DashboardService.periodoDe(fila.fecha);
      const barra = acumulado.get(clave) ?? { resueltas: 0, resto: 0 };
      if (fila.resultado === 'SOLUCIONADO_MESA')
        barra.resueltas += fila._count._all;
      else barra.resto += fila._count._all;
      acumulado.set(clave, barra);
    }

    // Los meses sin gestiones viajan en 0: el chart no cambia de tamaño.
    return Array.from({ length: MESES_SERIE }, (_, i) => {
      const inicio = DashboardService.inicioDeMes(mes, i + 1 - MESES_SERIE);
      const periodo = DashboardService.periodoDe(inicio);
      return {
        mes: NOMBRE_MES[inicio.getUTCMonth()],
        periodo,
        ...(acumulado.get(periodo) ?? { resueltas: 0, resto: 0 }),
      };
    });
  }

  private static heatmap(
    motivos: string[],
    filas: ConteoPorZona[],
  ): AnalisisMensualHeatmapDto {
    if (motivos.length === 0) return { motivos: [], zonas: [] };

    const columna = new Map(motivos.map((motivo, i) => [motivo, i]));
    const porZona = new Map<string, number[]>();
    for (const fila of filas) {
      const i = columna.get(fila.motivo);
      if (i === undefined) continue;
      const valores =
        porZona.get(fila.ubicacion) ??
        new Array<number>(motivos.length).fill(0);
      valores[i] += fila._count._all;
      porZona.set(fila.ubicacion, valores);
    }

    return {
      motivos,
      // Solo zonas con incidencias, alfabéticas: el front las lista tal cual.
      zonas: [...porZona.entries()]
        .map(([zona, valores]) => ({ zona, valores }))
        .sort((a, b) => a.zona.localeCompare(b.zona)),
    };
  }
}
