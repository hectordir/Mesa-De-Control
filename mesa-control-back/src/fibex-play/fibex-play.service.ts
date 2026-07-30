import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SeveridadIncidencia } from '../generated/prisma/enums';
import {
  DistribucionSeveridadDto,
  FallaCanalDto,
  FibexPlayResumenDto,
} from './dto/fibex-play-resumen.dto';
import { formatHoraVE } from '../common/time/index';

/** Orden fijo de la leyenda del donut: no depende de los datos. */
const SEVERIDADES: SeveridadIncidencia[] = ['CRITICA', 'ALTA', 'MEDIA'];

/** Fila de `groupBy` por severidad, tipada al mínimo. */
type ConteoPorSeveridad = {
  severidad: SeveridadIncidencia;
  _count: { _all: number };
};

/** Fila de `findMany` de un canal caído. */
type CanalCaido = {
  id: string;
  nombre: string;
  categoria: FallaCanalDto['categoria'];
  tipoIncidencia: FallaCanalDto['tipoIncidencia'];
  severidad: SeveridadIncidencia;
  detectadoEn: Date;
};

@Injectable()
export class FibexPlayService {
  constructor(private readonly prisma: PrismaService) {}

  async grilla(): Promise<FibexPlayResumenDto> {
    // Postgres agrega; aquí solo se da forma al DTO. `count` no lleva `where`:
    // el total incluye operativos y caídos.
    const [total, porSeveridad, caidos] = await Promise.all([
      this.prisma.canal.count(),
      this.prisma.canal.groupBy({
        by: ['severidad'],
        where: { estado: 'CAIDO' },
        _count: { _all: true },
      }) as unknown as Promise<ConteoPorSeveridad[]>,
      this.prisma.canal.findMany({
        where: { estado: 'CAIDO' },
        orderBy: { detectadoEn: 'asc' },
        select: {
          id: true,
          nombre: true,
          categoria: true,
          tipoIncidencia: true,
          severidad: true,
          detectadoEn: true,
        },
      }) as unknown as Promise<CanalCaido[]>,
    ]);

    const nCaidos = caidos.length;
    const operativos = total - nCaidos;

    return {
      actualizadoEn: new Date().toISOString(),
      kpis: {
        total,
        operativos,
        caidos: nCaidos,
        saludGrilla: total === 0 ? 100 : Math.round((operativos / total) * 100),
      },
      distribucionSeveridad: FibexPlayService.distribucion(porSeveridad),
      fallas: FibexPlayService.fallas(caidos),
    };
  }

  private static distribucion(
    filas: ConteoPorSeveridad[],
  ): DistribucionSeveridadDto[] {
    const por = new Map(filas.map((f) => [f.severidad, f._count._all]));
    // Orden fijo Crítica→Alta→Media; solo las severidades con total > 0.
    return SEVERIDADES.filter((s) => (por.get(s) ?? 0) > 0).map(
      (severidad) => ({
        severidad,
        total: por.get(severidad) as number,
      }),
    );
  }

  private static fallas(caidos: CanalCaido[]): FallaCanalDto[] {
    // `findMany` ya viene ordenado por detectadoEn asc; se reafirma por robustez.
    return [...caidos]
      .sort((a, b) => a.detectadoEn.getTime() - b.detectadoEn.getTime())
      .map((c) => ({
        id: c.id,
        nombre: c.nombre,
        categoria: c.categoria,
        tipoIncidencia: c.tipoIncidencia,
        severidad: c.severidad,
        // `hora` se muestra al usuario ⇒ hora de Caracas.
        hora: formatHoraVE(c.detectadoEn),
        // `detectadoEn` es el instante crudo para el front ⇒ ISO UTC.
        detectadoEn: c.detectadoEn.toISOString(),
      }));
  }
}
