import { Test, TestingModule } from '@nestjs/testing';

import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

type GroupByArgs = { by: string[]; take?: number };
type CountRow = Record<string, unknown> & { _count: { _all: number } };

/** Filas que devolvería `groupBy` para cada agrupación. */
interface Fixture {
  porResultado?: CountRow[];
  porOperador?: CountRow[];
  porMotivo?: CountRow[];
  actividad?: unknown[];
  usuarios?: { id: string; name: string }[];
}

describe('DashboardService', () => {
  let service: DashboardService;
  let groupBy: jest.Mock;
  let findMany: jest.Mock;
  let userFindMany: jest.Mock;

  const setup = async (fixture: Fixture) => {
    groupBy = jest.fn((args: GroupByArgs) => {
      const key = args.by.join('+');
      if (key === 'resultado')
        return Promise.resolve(fixture.porResultado ?? []);
      if (key === 'operadorId+resultado')
        return Promise.resolve(fixture.porOperador ?? []);
      if (key === 'motivo') {
        const rows = fixture.porMotivo ?? [];
        // La base ya aplica orden y corte; el mock replica el `take` que se le pide.
        return Promise.resolve(
          args.take === undefined ? rows : rows.slice(0, args.take),
        );
      }
      throw new Error(`groupBy inesperado: ${key}`);
    });
    findMany = jest.fn(() => Promise.resolve(fixture.actividad ?? []));
    userFindMany = jest.fn(() => Promise.resolve(fixture.usuarios ?? []));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            gestion: { groupBy, findMany },
            user: { findMany: userFindMany },
          },
        },
      ],
    }).compile();

    service = module.get(DashboardService);
  };

  const count = (n: number) => ({ _count: { _all: n } });

  describe('fecha', () => {
    it('usa el día de hoy cuando no se envía fecha', async () => {
      await setup({});
      const resumen = await service.monitorDiario();

      expect(resumen.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const hoy = new Date();
      const esperado = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      expect(resumen.fecha).toBe(esperado);
    });

    it('devuelve la fecha solicitada y filtra por ella en todas las consultas', async () => {
      await setup({});
      const resumen = await service.monitorDiario('2026-07-22');

      expect(resumen.fecha).toBe('2026-07-22');
      const dia = new Date('2026-07-22T00:00:00.000Z');
      for (const call of groupBy.mock.calls as [{ where: unknown }][]) {
        expect(call[0].where).toEqual({ fecha: dia });
      }
      expect((findMany.mock.calls[0] as [{ where: unknown }])[0].where).toEqual(
        {
          fecha: dia,
        },
      );
    });
  });

  describe('kpis', () => {
    it('efectividadMesa es 0 cuando no hay gestiones (sin dividir por cero)', async () => {
      await setup({});
      const { kpis } = await service.monitorDiario('2026-07-22');

      expect(kpis).toEqual({
        clientesAtendidos: 0,
        efectividadMesa: 0,
        enviadoSoporte2: 0,
        escaladoNoc: 0,
        pendienteCliente: 0,
      });
    });

    it('calcula los KPIs a partir del conteo por resultado', async () => {
      await setup({
        porResultado: [
          { resultado: 'SOLUCIONADO_MESA', ...count(198) },
          { resultado: 'ENVIADO_SOPORTE2', ...count(54) },
          { resultado: 'ESCALADO_NOC', ...count(31) },
          { resultado: 'PENDIENTE_CLIENTE', ...count(38) },
          { resultado: 'REAGENDADO', ...count(21) },
        ],
      });

      const { kpis } = await service.monitorDiario('2026-07-22');

      expect(kpis).toEqual({
        clientesAtendidos: 342,
        efectividadMesa: 58, // round(198 / 342 * 100)
        enviadoSoporte2: 54,
        escaladoNoc: 31,
        pendienteCliente: 38,
      });
    });

    it('redondea la efectividad (2 de 3 → 67)', async () => {
      await setup({
        porResultado: [
          { resultado: 'SOLUCIONADO_MESA', ...count(2) },
          { resultado: 'ESCALADO_NOC', ...count(1) },
        ],
      });

      const { kpis } = await service.monitorDiario('2026-07-22');
      expect(kpis.efectividadMesa).toBe(67);
    });
  });

  describe('distribucion', () => {
    it('incluye los 5 resultados aunque no tengan gestiones, en orden fijo', async () => {
      await setup({
        porResultado: [
          { resultado: 'ESCALADO_NOC', ...count(3) },
          { resultado: 'SOLUCIONADO_MESA', ...count(7) },
        ],
      });

      const { distribucion } = await service.monitorDiario('2026-07-22');

      expect(distribucion).toEqual([
        { resultado: 'SOLUCIONADO_MESA', total: 7 },
        { resultado: 'ENVIADO_SOPORTE2', total: 0 },
        { resultado: 'ESCALADO_NOC', total: 3 },
        { resultado: 'PENDIENTE_CLIENTE', total: 0 },
        { resultado: 'REAGENDADO', total: 0 },
      ]);
    });

    it('un día sin gestiones devuelve los 5 resultados en 0', async () => {
      await setup({});
      const { distribucion } = await service.monitorDiario('2026-07-22');

      expect(distribucion).toHaveLength(5);
      expect(distribucion.every((d) => d.total === 0)).toBe(true);
    });
  });

  describe('operadores', () => {
    it('agrega por operador, ordena por clientes desc y solo incluye a quien gestionó', async () => {
      await setup({
        porOperador: [
          { operadorId: 'op-2', resultado: 'SOLUCIONADO_MESA', ...count(5) },
          { operadorId: 'op-1', resultado: 'SOLUCIONADO_MESA', ...count(10) },
          { operadorId: 'op-1', resultado: 'ENVIADO_SOPORTE2', ...count(3) },
          { operadorId: 'op-1', resultado: 'ESCALADO_NOC', ...count(2) },
          { operadorId: 'op-1', resultado: 'REAGENDADO', ...count(1) },
          { operadorId: 'op-2', resultado: 'PENDIENTE_CLIENTE', ...count(4) },
        ],
        usuarios: [
          { id: 'op-1', name: 'Jhon Rivas' },
          { id: 'op-2', name: 'María León' },
          { id: 'op-3', name: 'Sin Gestiones' },
        ],
      });

      const { operadores } = await service.monitorDiario('2026-07-22');

      expect(operadores).toEqual([
        {
          id: 'op-1',
          nombre: 'Jhon Rivas',
          clientes: 16,
          mesa: 10,
          soporte2: 3,
          noc: 2,
        },
        {
          id: 'op-2',
          nombre: 'María León',
          clientes: 9,
          mesa: 5,
          soporte2: 0,
          noc: 0,
        },
      ]);
      // Solo se piden los nombres de los operadores con gestiones ese día.
      const [args] = userFindMany.mock.calls[0] as [
        { where: { id: { in: string[] } } },
      ];
      expect([...args.where.id.in].sort()).toEqual(['op-1', 'op-2']);
    });

    it('no envía `efectividad` ni `iniciales` (los deriva el front)', async () => {
      await setup({
        porOperador: [
          { operadorId: 'op-1', resultado: 'SOLUCIONADO_MESA', ...count(1) },
        ],
        usuarios: [{ id: 'op-1', name: 'Jhon Rivas' }],
      });

      const [operador] = (await service.monitorDiario('2026-07-22')).operadores;
      expect(Object.keys(operador).sort()).toEqual([
        'clientes',
        'id',
        'mesa',
        'noc',
        'nombre',
        'soporte2',
      ]);
    });

    it('devuelve [] cuando no hay gestiones', async () => {
      await setup({});
      expect((await service.monitorDiario('2026-07-22')).operadores).toEqual(
        [],
      );
    });
  });

  describe('topAverias', () => {
    it('pide a la base el orden desc con desempate alfabético y corte a 5', async () => {
      await setup({
        porMotivo: [
          { motivo: 'Corte de fibra (FTTH)', ...count(84) },
          { motivo: 'Sin señal / ONT', ...count(61) },
          { motivo: 'Lentitud de navegación', ...count(47) },
          { motivo: 'Falla en IPTV', ...count(33) },
          { motivo: 'WiFi intermitente', ...count(28) },
          { motivo: 'Cambio de clave WiFi', ...count(27) },
        ],
      });

      const { topAverias } = await service.monitorDiario('2026-07-22');

      expect(topAverias).toEqual([
        { motivo: 'Corte de fibra (FTTH)', total: 84 },
        { motivo: 'Sin señal / ONT', total: 61 },
        { motivo: 'Lentitud de navegación', total: 47 },
        { motivo: 'Falla en IPTV', total: 33 },
        { motivo: 'WiFi intermitente', total: 28 },
      ]);

      const motivoCall = (
        groupBy.mock.calls as [Record<string, unknown>][]
      ).find((c) => (c[0].by as string[]).join('+') === 'motivo');
      expect(motivoCall?.[0]).toMatchObject({
        take: 5,
        orderBy: [{ _count: { motivo: 'desc' } }, { motivo: 'asc' }],
      });
    });

    it('devuelve [] cuando no hay gestiones', async () => {
      await setup({});
      expect((await service.monitorDiario('2026-07-22')).topAverias).toEqual(
        [],
      );
    });
  });

  describe('actividad', () => {
    it('pide las 20 más recientes por createdAt desc y las mapea al DTO', async () => {
      await setup({
        actividad: [
          {
            id: 'g-1',
            resultado: 'SOLUCIONADO_MESA',
            ubicacion: 'Cond. Los Robles',
            createdAt: new Date('2026-07-22T10:42:00.000Z'),
            operador: { name: 'Jhon Rivas' },
          },
        ],
      });

      const { actividad } = await service.monitorDiario('2026-07-22');

      expect(actividad).toEqual([
        {
          id: 'g-1',
          operador: 'Jhon Rivas',
          resultado: 'SOLUCIONADO_MESA',
          ubicacion: 'Cond. Los Robles',
          hora: '2026-07-22T10:42:00.000Z',
        },
      ]);
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('devuelve [] cuando no hay gestiones', async () => {
      await setup({});
      expect((await service.monitorDiario('2026-07-22')).actividad).toEqual([]);
    });
  });
});
