import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ResultadoGestion } from '../generated/prisma/enums';
import { DeleteGestionesResultDto } from './dto/delete-gestiones.dto';
import {
  SupervisionBandejaItemDto,
  SupervisionDepuracionItemDto,
  SupervisionHeatmapDto,
  SupervisionResumenDto,
  SupervisionSlaBucketDto,
  SupervisionZonaDto,
  ZonaEstado,
} from './dto/supervision-resumen.dto';
import { hoyVE } from '../common/time/index';

/*
 * Mapeo del enum `ResultadoGestion` (heurística demo, documentada):
 *   SOLUCIONADO_MESA  → resuelta en mesa (efectividad).
 *   ENVIADO_SOPORTE2  → escalada a N2  (abierta / bandeja / cuenta como SLA-atendida).
 *   ESCALADO_NOC      → escalada a NOC (abierta / bandeja / KPI escaladosNoc).
 *   PENDIENTE_CLIENTE → a la espera del cliente (abierta, no cuenta SLA).
 *   REAGENDADO        → cita reagendada (cerrada dentro de SLA, no está en bandeja).
 */
const SOLUCIONADAS: ResultadoGestion = 'SOLUCIONADO_MESA';
const ESCALADO_NOC: ResultadoGestion = 'ESCALADO_NOC';
/** Cuenta como "atendida dentro de SLA": resuelta, derivada a N2 o reagendada. */
const CERRADAS_SLA: ResultadoGestion[] = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'REAGENDADO',
];
/** Backlog abierto que alimenta Bandeja N2 y los buckets de SLA por antigüedad. */
const ABIERTAS: ResultadoGestion[] = ['ENVIADO_SOPORTE2', 'ESCALADO_NOC'];
/**
 * Ventana del backlog abierto (Bandeja N2 + SLA): solo gestiones abiertas de los
 * últimos 30 días respecto de la fecha efectiva. Deja fuera el histórico mensual
 * (escaladas de meses previos) para que la vista muestre el backlog accionable.
 */
const VENTANA_ABIERTAS_DIAS = 30;

const EFECTIVIDAD_META = 85;
const SLA_META = 90;
const BANDEJA_LIMITE = 20;
const DEPURACION_LIMITE = 20;
const DIA_MS = 86_400_000;

/** Etiqueta legible del estado de una gestión abierta en la bandeja. */
const ESTADO_LABEL: Record<string, string> = {
  ENVIADO_SOPORTE2: 'Soporte N2',
  ESCALADO_NOC: 'Escalado NOC',
  PENDIENTE_CLIENTE: 'Pendiente cliente',
  REAGENDADO: 'Reagendado',
  SOLUCIONADO_MESA: 'Resuelto',
};

const SLA_BUCKETS: { key: string; label: string }[] = [
  { key: '0', label: 'Hoy' },
  { key: '1', label: '1 día' },
  { key: '2', label: '2 días' },
  { key: '3', label: '3 días' },
  { key: '4+', label: '4+ días' },
];

type ConteoResultado = {
  resultado: ResultadoGestion;
  _count: { _all: number };
};
type ConteoZona = { ubicacion: string; _count: { _all: number } };
type ConteoZonaMotivo = ConteoZona & { motivo: string };
type Abierta = {
  id: string;
  resultado: ResultadoGestion;
  motivo: string;
  ubicacion: string;
  abonado: string;
  fecha: Date;
};
type Reciente = {
  id: string;
  fecha: Date;
  abonado: string;
  operador: { name: string };
};

@Injectable()
export class SupervisionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Día de hoy en hora de Caracas, como `YYYY-MM-DD`. */
  private static hoy(): string {
    return hoyVE();
  }

  private static medianoche(fecha: string): Date {
    return new Date(`${fecha}T00:00:00.000Z`);
  }

  async resumen(fecha?: string): Promise<SupervisionResumenDto> {
    const dia = fecha ?? SupervisionService.hoy();
    const efectiva = SupervisionService.medianoche(dia);
    const anterior = new Date(efectiva.getTime() - DIA_MS);
    // Ventana del backlog abierto: [efectiva − 30 días, ∞). Excluye el histórico.
    const desdeAbiertas = new Date(
      efectiva.getTime() - VENTANA_ABIERTAS_DIAS * DIA_MS,
    );

    const [
      porResultado,
      porResultadoAyer,
      porZona,
      porZonaMotivo,
      abiertas,
      recientes,
    ] = await Promise.all([
      this.prisma.gestion.groupBy({
        by: ['resultado'],
        where: { fecha: efectiva },
        _count: { _all: true },
      }) as unknown as Promise<ConteoResultado[]>,
      this.prisma.gestion.groupBy({
        by: ['resultado'],
        where: { fecha: anterior },
        _count: { _all: true },
      }) as unknown as Promise<ConteoResultado[]>,
      this.prisma.gestion.groupBy({
        by: ['ubicacion'],
        where: { fecha: efectiva },
        _count: { _all: true },
      }) as unknown as Promise<ConteoZona[]>,
      this.prisma.gestion.groupBy({
        by: ['ubicacion', 'motivo'],
        where: { fecha: efectiva },
        _count: { _all: true },
      }) as unknown as Promise<ConteoZonaMotivo[]>,
      this.prisma.gestion.findMany({
        where: { resultado: { in: ABIERTAS }, fecha: { gte: desdeAbiertas } },
        select: {
          id: true,
          resultado: true,
          motivo: true,
          ubicacion: true,
          abonado: true,
          fecha: true,
        },
      }) as unknown as Promise<Abierta[]>,
      this.prisma.gestion.findMany({
        orderBy: { createdAt: 'desc' },
        take: DEPURACION_LIMITE,
        select: {
          id: true,
          fecha: true,
          abonado: true,
          operador: { select: { name: true } },
        },
      }) as unknown as Promise<Reciente[]>,
    ]);

    const conDias = abiertas
      .map((a) => ({
        ...a,
        dias: Math.max(
          0,
          Math.floor((efectiva.getTime() - a.fecha.getTime()) / DIA_MS),
        ),
      }))
      .sort((a, b) => b.dias - a.dias || a.id.localeCompare(b.id));

    return {
      fecha: dia,
      kpis: SupervisionService.kpis(porResultado, porResultadoAyer),
      zonas: SupervisionService.zonas(porZona),
      bandejaN2: SupervisionService.bandeja(conDias),
      sla: SupervisionService.sla(conDias),
      heatmap: SupervisionService.heatmap(porZonaMotivo),
      depuracion: SupervisionService.depuracion(recientes),
    };
  }

  async eliminar(ids: string[]): Promise<DeleteGestionesResultDto> {
    const { count } = await this.prisma.gestion.deleteMany({
      where: { id: { in: ids } },
    });
    return { deleted: count };
  }

  private static totalPorResultado(
    filas: ConteoResultado[],
  ): Map<ResultadoGestion, number> {
    return new Map(filas.map((f) => [f.resultado, f._count._all]));
  }

  private static suma(filas: ConteoResultado[]): number {
    return filas.reduce((n, f) => n + f._count._all, 0);
  }

  private static kpis(
    hoy: ConteoResultado[],
    ayer: ConteoResultado[],
  ): SupervisionResumenDto['kpis'] {
    const porHoy = SupervisionService.totalPorResultado(hoy);
    const porAyer = SupervisionService.totalPorResultado(ayer);
    const atendidosHoy = SupervisionService.suma(hoy);
    const atendidosAyer = SupervisionService.suma(ayer);
    const solucionadas = porHoy.get(SOLUCIONADAS) ?? 0;
    const escaladosNoc = porHoy.get(ESCALADO_NOC) ?? 0;
    const cerradas = CERRADAS_SLA.reduce((n, r) => n + (porHoy.get(r) ?? 0), 0);
    const pct = (num: number) =>
      atendidosHoy === 0 ? 0 : Math.round((num / atendidosHoy) * 100);

    return {
      atendidosHoy,
      atendidosDelta: atendidosHoy - atendidosAyer,
      efectividad: pct(solucionadas),
      efectividadMeta: EFECTIVIDAD_META,
      escaladosNoc,
      escaladosDelta: escaladosNoc - (porAyer.get(ESCALADO_NOC) ?? 0),
      slaCumplido: pct(cerradas),
      slaMeta: SLA_META,
    };
  }

  private static estadoZona(count: number): ZonaEstado {
    if (count >= 10) return 'danger';
    if (count >= 5) return 'warning';
    if (count >= 3) return 'info';
    return 'success';
  }

  private static zonas(filas: ConteoZona[]): SupervisionZonaDto[] {
    return filas
      .map((f) => ({
        nombre: f.ubicacion,
        count: f._count._all,
        estado: SupervisionService.estadoZona(f._count._all),
      }))
      .sort((a, b) => b.count - a.count || a.nombre.localeCompare(b.nombre));
  }

  private static bandeja(
    abiertas: (Abierta & { dias: number })[],
  ): SupervisionBandejaItemDto[] {
    return abiertas.slice(0, BANDEJA_LIMITE).map((a) => ({
      id: a.id,
      orden: `#OS-${a.id.slice(-6).toUpperCase()}`,
      abonado: a.abonado,
      zona: a.ubicacion,
      motivo: a.motivo,
      dias: a.dias,
      estado: ESTADO_LABEL[a.resultado] ?? a.resultado,
    }));
  }

  private static sla(abiertas: { dias: number }[]): SupervisionSlaBucketDto[] {
    const conteo = new Map<string, number>(SLA_BUCKETS.map((b) => [b.key, 0]));
    for (const { dias } of abiertas) {
      const key = dias >= 4 ? '4+' : String(dias);
      conteo.set(key, (conteo.get(key) ?? 0) + 1);
    }
    return SLA_BUCKETS.map((b) => ({ ...b, count: conteo.get(b.key) ?? 0 }));
  }

  private static heatmap(filas: ConteoZonaMotivo[]): SupervisionHeatmapDto {
    if (filas.length === 0) return { motivos: [], filas: [] };

    // Motivos en orden de primera aparición: estable respecto de la consulta.
    const motivos: string[] = [];
    const indice = new Map<string, number>();
    for (const f of filas) {
      if (!indice.has(f.motivo)) {
        indice.set(f.motivo, motivos.length);
        motivos.push(f.motivo);
      }
    }

    const porZona = new Map<string, number[]>();
    for (const f of filas) {
      const celdas =
        porZona.get(f.ubicacion) ?? new Array<number>(motivos.length).fill(0);
      celdas[indice.get(f.motivo)!] += f._count._all;
      porZona.set(f.ubicacion, celdas);
    }

    return {
      motivos,
      filas: [...porZona.entries()]
        .map(([zona, celdas]) => ({
          zona,
          celdas,
          total: celdas.reduce((n, c) => n + c, 0),
        }))
        .sort((a, b) => b.total - a.total || a.zona.localeCompare(b.zona)),
    };
  }

  private static depuracion(filas: Reciente[]): SupervisionDepuracionItemDto[] {
    return filas.map((g) => ({
      id: g.id,
      fecha: g.fecha.toISOString().slice(0, 10),
      operador: g.operador.name,
      abonado: g.abonado,
    }));
  }
}
