import { Test, TestingModule } from '@nestjs/testing';

import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

type GroupByArgs = { by: string[]; take?: number; where?: unknown };
type CountRow = Record<string, unknown> & { _count: { _all: number } };

interface Fixture {
  /** groupBy(['resultado']) del mes pedido. */
  porResultado?: CountRow[];
  /** groupBy(['fecha', 'resultado']) de la ventana de 4 meses. */
  porDia?: CountRow[];
  /** groupBy(['motivo']) del mes, ya ordenado desc por la base. */
  porMotivo?: CountRow[];
  /** groupBy(['ubicacion', 'motivo']) del mes. */
  porZona?: CountRow[];
}

const count = (n: number) => ({ _count: { _all: n } });
const dia = (fecha: string, resultado: string, n: number) => ({
  fecha: new Date(`${fecha}T00:00:00.000Z`),
  resultado,
  ...count(n),
});
const celda = (ubicacion: string, motivo: string, n: number) => ({
  ubicacion,
  motivo,
  ...count(n),
});

describe('DashboardService · analisisMensual', () => {
  let service: DashboardService;
  let groupBy: jest.Mock;

  const setup = async (fixture: Fixture) => {
    groupBy = jest.fn((args: GroupByArgs) => {
      const key = args.by.join('+');
      if (key === 'resultado')
        return Promise.resolve(fixture.porResultado ?? []);
      if (key === 'fecha+resultado')
        return Promise.resolve(fixture.porDia ?? []);
      if (key === 'motivo')
        return Promise.resolve((fixture.porMotivo ?? []).slice(0, args.take));
      if (key === 'ubicacion+motivo')
        return Promise.resolve(fixture.porZona ?? []);
      throw new Error(`groupBy inesperado: ${key}`);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            gestion: { groupBy, findMany: jest.fn() },
            user: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
  };

  const llamada = (key: string) =>
    (groupBy.mock.calls as [Record<string, unknown>][]).find(
      (c) => (c[0].by as string[]).join('+') === key,
    )?.[0];

  describe('periodo', () => {
    it('usa el mes en curso cuando no se envía periodo', async () => {
      await setup({});
      const { periodo } = await service.analisisMensual();

      const hoy = new Date();
      expect(periodo).toBe(
        `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`,
      );
    });

    it('acota el mes pedido con un rango semiabierto [inicio, mes siguiente)', async () => {
      await setup({});
      await service.analisisMensual('2026-05');

      expect(llamada('resultado')?.where).toEqual({
        fecha: {
          gte: new Date('2026-05-01T00:00:00.000Z'),
          lt: new Date('2026-06-01T00:00:00.000Z'),
        },
      });
    });

    it('la serie abarca el mes pedido y los 3 anteriores', async () => {
      await setup({});
      await service.analisisMensual('2026-01');

      expect(llamada('fecha+resultado')?.where).toEqual({
        fecha: {
          gte: new Date('2025-10-01T00:00:00.000Z'),
          lt: new Date('2026-02-01T00:00:00.000Z'),
        },
      });
    });
  });

  describe('kpis', () => {
    it('cuenta volumen, resueltos y escalados, con la meta de negocio en 65', async () => {
      await setup({
        porResultado: [
          { resultado: 'SOLUCIONADO_MESA', ...count(209) },
          { resultado: 'ENVIADO_SOPORTE2', ...count(180) },
          { resultado: 'ESCALADO_NOC', ...count(22) },
          { resultado: 'PENDIENTE_CLIENTE', ...count(50) },
          { resultado: 'REAGENDADO', ...count(24) },
        ],
      });

      const { kpis } = await service.analisisMensual('2026-05');

      expect(kpis).toEqual({
        volumen: 485,
        resueltos: 209,
        escalados: 22,
        metaEfectividad: 65,
      });
    });

    it('un mes sin gestiones deja los KPIs en 0 (la meta se mantiene)', async () => {
      await setup({});
      expect((await service.analisisMensual('2026-05')).kpis).toEqual({
        volumen: 0,
        resueltos: 0,
        escalados: 0,
        metaEfectividad: 65,
      });
    });
  });

  describe('serie', () => {
    it('devuelve 4 meses en orden cronológico, con nombre en español', async () => {
      await setup({
        porDia: [
          dia('2026-02-03', 'SOLUCIONADO_MESA', 545),
          dia('2026-02-11', 'ESCALADO_NOC', 735),
          dia('2026-05-02', 'SOLUCIONADO_MESA', 209),
          dia('2026-05-09', 'ENVIADO_SOPORTE2', 276),
        ],
      });

      const { serie } = await service.analisisMensual('2026-05');

      expect(serie).toEqual([
        { mes: 'Febrero', periodo: '2026-02', resueltas: 545, resto: 735 },
        { mes: 'Marzo', periodo: '2026-03', resueltas: 0, resto: 0 },
        { mes: 'Abril', periodo: '2026-04', resueltas: 0, resto: 0 },
        { mes: 'Mayo', periodo: '2026-05', resueltas: 209, resto: 276 },
      ]);
    });

    it('cruza el año hacia atrás', async () => {
      await setup({});
      const { serie } = await service.analisisMensual('2026-01');

      expect(serie.map((b) => b.periodo)).toEqual([
        '2025-10',
        '2025-11',
        '2025-12',
        '2026-01',
      ]);
      expect(serie[0].mes).toBe('Octubre');
      expect(serie.every((b) => b.resueltas === 0 && b.resto === 0)).toBe(true);
    });
  });

  describe('heatmap', () => {
    it('toma los 6 motivos más frecuentes del mes y arma la matriz por zona', async () => {
      await setup({
        porMotivo: [
          { motivo: 'Falla LOS', ...count(90) },
          { motivo: 'Internet Lento', ...count(80) },
          { motivo: 'Sin Internet', ...count(70) },
          { motivo: 'Usuario Clave GNT', ...count(60) },
          { motivo: 'Caídas Seguidas', ...count(50) },
          { motivo: 'No Navega', ...count(40) },
          { motivo: 'WiFi intermitente', ...count(30) },
        ],
        porZona: [
          celda('Macuto', 'Falla LOS', 7),
          celda('Macuto', 'No Navega', 2),
          celda('Canaima', 'Sin Internet', 5),
          // Un motivo fuera del top 6 no aporta columna ni fila.
          celda('Zamora', 'WiFi intermitente', 30),
        ],
      });

      const { heatmap } = await service.analisisMensual('2026-05');

      expect(heatmap.motivos).toEqual([
        'Falla LOS',
        'Internet Lento',
        'Sin Internet',
        'Usuario Clave GNT',
        'Caídas Seguidas',
        'No Navega',
      ]);
      // Zonas alfabéticas y una fila por zona con incidencias del top 6.
      expect(heatmap.zonas).toEqual([
        { zona: 'Canaima', valores: [0, 0, 5, 0, 0, 0] },
        { zona: 'Macuto', valores: [7, 0, 0, 0, 0, 2] },
      ]);
      expect(
        heatmap.zonas.every((z) => z.valores.length === heatmap.motivos.length),
      ).toBe(true);
    });

    it('pide a la base el top 6 ordenado desc con desempate alfabético', async () => {
      await setup({});
      await service.analisisMensual('2026-05');

      expect(llamada('motivo')).toMatchObject({
        take: 6,
        orderBy: [{ _count: { motivo: 'desc' } }, { motivo: 'asc' }],
      });
    });

    it('un mes sin gestiones devuelve motivos y zonas vacíos', async () => {
      await setup({});
      expect((await service.analisisMensual('2026-05')).heatmap).toEqual({
        motivos: [],
        zonas: [],
      });
    });
  });
});
