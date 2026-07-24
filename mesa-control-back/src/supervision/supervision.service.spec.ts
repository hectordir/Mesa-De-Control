import { PrismaService } from '../prisma/prisma.service';
import { SupervisionService } from './supervision.service';

const count = (n: number) => ({ _count: { _all: n } });
const FECHA = '2026-07-22';
const efectiva = new Date(`${FECHA}T00:00:00.000Z`);
const d = (dias: number) => new Date(efectiva.getTime() - dias * 86_400_000);

/**
 * Prisma mockeado: despacha `groupBy` por (`by`, `where.fecha`) y sirve
 * `findMany` según el `where.resultado` (abiertas) o el `orderBy createdAt`.
 */
function mockPrisma() {
  const abiertas = [
    // dias 3, ESCALADO_NOC
    {
      id: 'abc4f2a1c0',
      resultado: 'ESCALADO_NOC',
      motivo: 'Corte de fibra (FTTH)',
      ubicacion: 'Caraballeda',
      abonado: 'Ab-1',
      fecha: d(3),
    },
    // dias 0, ENVIADO_SOPORTE2
    {
      id: 'def0000001',
      resultado: 'ENVIADO_SOPORTE2',
      motivo: 'Sin señal / ONT',
      ubicacion: 'Macuto',
      abonado: 'Ab-2',
      fecha: d(0),
    },
    // dias 5, ESCALADO_NOC (más antigua)
    {
      id: 'ghi0000002',
      resultado: 'ESCALADO_NOC',
      motivo: 'Falla en IPTV',
      ubicacion: 'Maiquetía',
      abonado: 'Ab-3',
      fecha: d(5),
    },
    // dias 1, ENVIADO_SOPORTE2
    {
      id: 'jkl0000003',
      resultado: 'ENVIADO_SOPORTE2',
      motivo: 'WiFi intermitente',
      ubicacion: 'La Guaira',
      abonado: 'Ab-4',
      fecha: d(1),
    },
  ];
  const recientes = [
    {
      id: 'r1',
      fecha: efectiva,
      abonado: 'Ab-9',
      operador: { name: 'Jhon Rivas' },
    },
    {
      id: 'r2',
      fecha: efectiva,
      abonado: 'Ab-8',
      operador: { name: 'María León' },
    },
  ];

  const groupBy = jest.fn(
    (args: { by: string[]; where?: { fecha?: Date } }) => {
      const key = args.by.join('+');
      const esHoy = args.where?.fecha?.getTime() === efectiva.getTime();
      if (key === 'resultado') {
        return Promise.resolve(
          esHoy
            ? [
                { resultado: 'SOLUCIONADO_MESA', ...count(198) },
                { resultado: 'ENVIADO_SOPORTE2', ...count(54) },
                { resultado: 'ESCALADO_NOC', ...count(31) },
                { resultado: 'PENDIENTE_CLIENTE', ...count(38) },
                { resultado: 'REAGENDADO', ...count(21) },
              ]
            : [
                { resultado: 'SOLUCIONADO_MESA', ...count(150) },
                { resultado: 'ESCALADO_NOC', ...count(34) },
              ],
        );
      }
      if (key === 'ubicacion') {
        return Promise.resolve([
          { ubicacion: 'Caraballeda', ...count(12) },
          { ubicacion: 'Macuto', ...count(6) },
          { ubicacion: 'La Guaira', ...count(3) },
          { ubicacion: 'Chuspa', ...count(1) },
        ]);
      }
      if (key === 'ubicacion+motivo') {
        return Promise.resolve([
          {
            ubicacion: 'Caraballeda',
            motivo: 'Corte de fibra (FTTH)',
            ...count(8),
          },
          { ubicacion: 'Caraballeda', motivo: 'Sin señal / ONT', ...count(4) },
          { ubicacion: 'Macuto', motivo: 'Corte de fibra (FTTH)', ...count(6) },
        ]);
      }
      throw new Error(`groupBy inesperado: ${key}`);
    },
  );

  // Una abierta vieja (35 días): debe quedar fuera de la ventana de 30 días.
  const vieja = {
    id: 'old0000099',
    resultado: 'ESCALADO_NOC',
    motivo: 'Corte de fibra (FTTH)',
    ubicacion: 'Naiguatá',
    abonado: 'Ab-vieja',
    fecha: d(35),
  };

  // El mock aplica el filtro `fecha: { gte }` igual que Postgres, para probar
  // de verdad la ventana temporal del backlog abierto.
  const findMany = jest.fn(
    (args: {
      where?: { resultado?: unknown; fecha?: { gte?: Date } };
      orderBy?: unknown;
    }) => {
      if (args.where?.resultado) {
        const gte = args.where.fecha?.gte;
        const todas = [...abiertas, vieja];
        return Promise.resolve(
          gte ? todas.filter((a) => a.fecha.getTime() >= gte.getTime()) : todas,
        );
      }
      return Promise.resolve(recientes);
    },
  );

  return {
    prisma: { gestion: { groupBy, findMany } } as unknown as PrismaService,
    abiertas,
    recientes,
  };
}

describe('SupervisionService', () => {
  it('calcula KPIs con el mapeo de enum y los deltas vs. día anterior', async () => {
    const { prisma } = mockPrisma();
    const res = await new SupervisionService(prisma).resumen(FECHA);

    expect(res.fecha).toBe(FECHA);
    // atendidos = 198+54+31+38+21 = 342; ayer = 150+34 = 184; delta = 158
    expect(res.kpis.atendidosHoy).toBe(342);
    expect(res.kpis.atendidosDelta).toBe(158);
    // efectividad = round(198/342*100) = 58
    expect(res.kpis.efectividad).toBe(58);
    expect(res.kpis.efectividadMeta).toBe(85);
    // escaladosNoc hoy = 31, ayer = 34, delta = -3
    expect(res.kpis.escaladosNoc).toBe(31);
    expect(res.kpis.escaladosDelta).toBe(-3);
    // cerradas (SLA) = SOLUCIONADO_MESA + ENVIADO_SOPORTE2 + REAGENDADO = 198+54+21 = 273
    // sla = round(273/342*100) = 80
    expect(res.kpis.slaCumplido).toBe(80);
    expect(res.kpis.slaMeta).toBe(90);
  });

  it('mapea zonas con estado por umbral y ordena por count desc', async () => {
    const { prisma } = mockPrisma();
    const res = await new SupervisionService(prisma).resumen(FECHA);

    expect(res.zonas).toEqual([
      { nombre: 'Caraballeda', count: 12, estado: 'danger' },
      { nombre: 'Macuto', count: 6, estado: 'warning' },
      { nombre: 'La Guaira', count: 3, estado: 'info' },
      { nombre: 'Chuspa', count: 1, estado: 'success' },
    ]);
  });

  it('bandeja N2: abiertas por antigüedad desc, máx 20, orden #OS- y estado legible', async () => {
    const { prisma } = mockPrisma();
    const res = await new SupervisionService(prisma).resumen(FECHA);

    expect(res.bandejaN2.map((b) => b.dias)).toEqual([5, 3, 1, 0]);
    expect(res.bandejaN2[0]).toEqual({
      id: 'ghi0000002',
      orden: '#OS-000002',
      abonado: 'Ab-3',
      zona: 'Maiquetía',
      motivo: 'Falla en IPTV',
      dias: 5,
      estado: 'Escalado NOC',
    });
    expect(res.bandejaN2[2].estado).toBe('Soporte N2');
  });

  it('sla: buckets 0,1,2,3,4+ siempre presentes con el conteo por antigüedad', async () => {
    const { prisma } = mockPrisma();
    const res = await new SupervisionService(prisma).resumen(FECHA);

    expect(res.sla.map((s) => s.key)).toEqual(['0', '1', '2', '3', '4+']);
    const porKey = Object.fromEntries(res.sla.map((s) => [s.key, s.count]));
    // dias presentes: 0,1,3,5 → bucket 4+ recibe el de 5 días
    expect(porKey).toEqual({ '0': 1, '1': 1, '2': 0, '3': 1, '4+': 1 });
  });

  it('ventana 30 días: excluye abiertas de >30 días de bandeja y sla', async () => {
    const { prisma } = mockPrisma();
    const res = await new SupervisionService(prisma).resumen(FECHA);

    // La abierta de 35 días (id old0000099) no aparece en la bandeja...
    expect(res.bandejaN2.some((b) => b.id === 'old0000099')).toBe(false);
    expect(res.bandejaN2.every((b) => b.dias <= 30)).toBe(true);
    // ...ni infla el bucket 4+ (solo cuenta la de 5 días dentro de la ventana).
    const porKey = Object.fromEntries(res.sla.map((s) => [s.key, s.count]));
    expect(porKey['4+']).toBe(1);
    // La de 5 días (≤30) sí sigue presente.
    expect(res.bandejaN2.some((b) => b.id === 'ghi0000002')).toBe(true);
  });

  it('heatmap: motivos alineados con celdas por zona y total por fila', async () => {
    const { prisma } = mockPrisma();
    const res = await new SupervisionService(prisma).resumen(FECHA);

    expect(res.heatmap.motivos).toEqual([
      'Corte de fibra (FTTH)',
      'Sin señal / ONT',
    ]);
    expect(res.heatmap.filas).toEqual([
      { zona: 'Caraballeda', celdas: [8, 4], total: 12 },
      { zona: 'Macuto', celdas: [6, 0], total: 6 },
    ]);
  });

  it('depuracion: últimas gestiones con fecha, operador y abonado', async () => {
    const { prisma } = mockPrisma();
    const res = await new SupervisionService(prisma).resumen(FECHA);

    expect(res.depuracion).toEqual([
      { id: 'r1', fecha: FECHA, operador: 'Jhon Rivas', abonado: 'Ab-9' },
      { id: 'r2', fecha: FECHA, operador: 'María León', abonado: 'Ab-8' },
    ]);
  });

  it('efectividad y sla en 0 (sin división por cero) cuando no hay gestiones', async () => {
    const groupBy = jest.fn(() => Promise.resolve([]));
    const findMany = jest.fn(() => Promise.resolve([]));
    const prisma = {
      gestion: { groupBy, findMany },
    } as unknown as PrismaService;

    const res = await new SupervisionService(prisma).resumen(FECHA);
    expect(res.kpis.atendidosHoy).toBe(0);
    expect(res.kpis.efectividad).toBe(0);
    expect(res.kpis.slaCumplido).toBe(0);
    expect(res.zonas).toEqual([]);
    expect(res.bandejaN2).toEqual([]);
    expect(res.heatmap).toEqual({ motivos: [], filas: [] });
    expect(res.sla.map((s) => s.count)).toEqual([0, 0, 0, 0, 0]);
  });

  it('borra en bloque y devuelve el conteo', async () => {
    const deleteMany = jest.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      gestion: { deleteMany },
    } as unknown as PrismaService;

    const res = await new SupervisionService(prisma).eliminar(['a', 'b']);
    expect(res).toEqual({ deleted: 2 });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] } },
    });
  });
});
