import { Test, TestingModule } from '@nestjs/testing';

import { FibexPlayService } from './fibex-play.service';
import { PrismaService } from '../prisma/prisma.service';

type CountRow = { severidad: string; _count: { _all: number } };

interface Fixture {
  total?: number;
  porSeveridad?: CountRow[];
  fallas?: unknown[];
}

const count = (n: number) => ({ _count: { _all: n } });

/** Una caída completa lista para `findMany` (fila de Prisma). */
const caido = (
  id: string,
  severidad: string,
  detectadoEn: string,
  extra: Record<string, unknown> = {},
) => ({
  id,
  nombre: id,
  categoria: 'DEPORTES',
  tipoIncidencia: 'SIN_SENAL',
  severidad,
  detectadoEn: new Date(detectadoEn),
  ...extra,
});

describe('FibexPlayService', () => {
  let service: FibexPlayService;
  let canalCount: jest.Mock;
  let groupBy: jest.Mock;
  let findMany: jest.Mock;

  const setup = async (fixture: Fixture) => {
    canalCount = jest.fn(() => Promise.resolve(fixture.total ?? 0));
    groupBy = jest.fn(() => Promise.resolve(fixture.porSeveridad ?? []));
    findMany = jest.fn(() => Promise.resolve(fixture.fallas ?? []));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FibexPlayService,
        {
          provide: PrismaService,
          useValue: { canal: { count: canalCount, groupBy, findMany } },
        },
      ],
    }).compile();

    service = module.get(FibexPlayService);
  };

  it('actualizadoEn es un ISO 8601 (now del servidor)', async () => {
    await setup({ total: 0 });
    const res = await service.grilla();
    expect(res.actualizadoEn).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(new Date(res.actualizadoEn).toISOString()).toBe(res.actualizadoEn);
  });

  it('calcula caidos/operativos y saludGrilla redondeado', async () => {
    await setup({
      total: 165,
      porSeveridad: [
        { severidad: 'CRITICA', ...count(2) },
        { severidad: 'ALTA', ...count(2) },
        { severidad: 'MEDIA', ...count(2) },
      ],
      fallas: [
        caido('a', 'CRITICA', '2026-07-22T09:42:00.000Z'),
        caido('b', 'CRITICA', '2026-07-22T10:07:00.000Z'),
        caido('c', 'ALTA', '2026-07-22T10:18:00.000Z'),
        caido('d', 'ALTA', '2026-07-22T10:26:00.000Z'),
        caido('e', 'MEDIA', '2026-07-22T10:39:00.000Z'),
        caido('f', 'MEDIA', '2026-07-22T10:51:00.000Z'),
      ],
    });
    const res = await service.grilla();

    // operativos = 159; 159/165*100 = 96.36 → 96
    expect(res.kpis).toEqual({
      total: 165,
      operativos: 159,
      caidos: 6,
      saludGrilla: 96,
    });
  });

  it('saludGrilla redondea al entero más cercano', async () => {
    // 1 caído de 3 → operativos 2/3 = 66.67 → 67
    await setup({
      total: 3,
      porSeveridad: [{ severidad: 'ALTA', ...count(1) }],
      fallas: [caido('x', 'ALTA', '2026-07-22T10:00:00.000Z')],
    });
    const res = await service.grilla();
    expect(res.kpis.saludGrilla).toBe(67);
    expect(res.kpis.caidos).toBe(1);
    expect(res.kpis.operativos).toBe(2);
  });

  it('distribucionSeveridad: solo presentes, orden Crítica→Alta→Media', async () => {
    // Sin ALTA presente: no debe aparecer; MEDIA antes que nada se ordena al final.
    await setup({
      total: 10,
      porSeveridad: [
        { severidad: 'MEDIA', ...count(1) },
        { severidad: 'CRITICA', ...count(3) },
      ],
      fallas: [
        caido('a', 'CRITICA', '2026-07-22T09:00:00.000Z'),
        caido('b', 'MEDIA', '2026-07-22T09:30:00.000Z'),
      ],
    });
    const res = await service.grilla();
    expect(res.distribucionSeveridad).toEqual([
      { severidad: 'CRITICA', total: 3 },
      { severidad: 'MEDIA', total: 1 },
    ]);
  });

  it('fallas ordenadas por detectadoEn asc con hora HH:mm', async () => {
    await setup({
      total: 5,
      porSeveridad: [
        { severidad: 'CRITICA', ...count(1) },
        { severidad: 'MEDIA', ...count(1) },
      ],
      // Deliberadamente desordenadas: el servicio debe reordenarlas.
      fallas: [
        caido('tarde', 'MEDIA', '2026-07-22T10:51:00.000Z', {
          nombre: 'Fox Sports',
          categoria: 'DEPORTES',
          tipoIncidencia: 'SENAL_INTERMITENTE',
        }),
        caido('temprano', 'CRITICA', '2026-07-22T09:42:00.000Z', {
          nombre: 'ESPN',
          categoria: 'DEPORTES',
          tipoIncidencia: 'SIN_SENAL',
        }),
      ],
    });
    const res = await service.grilla();

    expect(res.fallas.map((f) => f.id)).toEqual(['temprano', 'tarde']);
    expect(res.fallas[0]).toEqual({
      id: 'temprano',
      nombre: 'ESPN',
      categoria: 'DEPORTES',
      tipoIncidencia: 'SIN_SENAL',
      severidad: 'CRITICA',
      // 09:42 UTC = 05:42 en Caracas; `detectadoEn` se queda en ISO UTC.
      hora: '05:42',
      detectadoEn: '2026-07-22T09:42:00.000Z',
    });
    expect(res.fallas[1].hora).toBe('06:51');
  });

  it('franja 00:00–04:00 UTC: la hora es la del día anterior en Caracas', async () => {
    await setup({
      fallas: [
        caido('madrugada', 'MEDIA', '2026-07-22T02:30:00.000Z', {
          nombre: 'ESPN',
          categoria: 'DEPORTES',
          tipoIncidencia: 'SIN_SENAL',
        }),
      ],
    });
    const res = await service.grilla();
    expect(res.fallas[0].hora).toBe('22:30');
    expect(res.fallas[0].detectadoEn).toBe('2026-07-22T02:30:00.000Z');
  });

  it('total=0 ⇒ saludGrilla 100 y arrays vacíos', async () => {
    await setup({ total: 0 });
    const res = await service.grilla();

    expect(res.kpis).toEqual({
      total: 0,
      operativos: 0,
      caidos: 0,
      saludGrilla: 100,
    });
    expect(res.distribucionSeveridad).toEqual([]);
    expect(res.fallas).toEqual([]);
  });
});
