import { Test, TestingModule } from '@nestjs/testing';

import { GestionService, codigoDeId } from './gestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListGestionesQueryDto } from './dto/list-gestiones-query.dto';

/** Fila que devolvería `prisma.gestion.findMany` con la relación `operador`. */
const fila = (over: Record<string, unknown> = {}) => ({
  id: 'g-1',
  operadorId: 'op-1',
  resultado: 'SOLUCIONADO_MESA',
  ubicacion: 'Norte',
  fecha: new Date('2026-07-17T00:00:00.000Z'),
  createdAt: new Date('2026-07-17T14:42:00.000Z'),
  abonado: 'Cond. Los Robles',
  telefono: '0412-118-4420',
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  canal: 'TELEGRAM',
  duracion: 12,
  operador: { id: 'op-1', name: 'Jhon Rivas' },
  ...over,
});

const query = (
  over: Partial<ListGestionesQueryDto> = {},
): ListGestionesQueryDto => ({ ...over });

describe('GestionService.listar', () => {
  let service: GestionService;
  let findMany: jest.Mock;
  let count: jest.Mock;
  let groupBy: jest.Mock;

  const setup = async () => {
    findMany = jest.fn().mockResolvedValue([fila()]);
    // count devuelve 3 si el where trae `resultado` (total filtrado) y 20 si no
    // (counts.total): así el test distingue ambas llamadas por sus argumentos.
    count = jest.fn((args: { where?: Record<string, unknown> }) =>
      Promise.resolve(args.where && 'resultado' in args.where ? 3 : 20),
    );
    groupBy = jest.fn().mockResolvedValue([
      { resultado: 'SOLUCIONADO_MESA', _count: { _all: 12 } },
      { resultado: 'ESCALADO_NOC', _count: { _all: 3 } },
    ]);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GestionService,
        {
          provide: PrismaService,
          useValue: { gestion: { findMany, count, groupBy } },
        },
      ],
    }).compile();
    service = moduleRef.get(GestionService);
  };

  beforeEach(setup);

  const findManyArgs = () =>
    (findMany.mock.calls[0] as [Record<string, unknown>])[0];
  const groupByArgs = () =>
    (groupBy.mock.calls[0] as [Record<string, unknown>])[0];

  it('aplica defaults: page 1, pageSize 10, orden fecha desc', async () => {
    await service.listar(query());
    const args = findManyArgs();
    expect(args.skip).toBe(0);
    expect(args.take).toBe(10);
    expect(args.orderBy).toEqual([
      { fecha: 'desc' },
      { createdAt: 'desc' },
      { id: 'asc' },
    ]);
  });

  it('pagina con skip/take y devuelve page/pageSize en la respuesta', async () => {
    const res = await service.listar(query({ page: 3, pageSize: 25 }));
    const args = findManyArgs();
    expect(args.skip).toBe(50);
    expect(args.take).toBe(25);
    expect(res.page).toBe(3);
    expect(res.pageSize).toBe(25);
  });

  it('search filtra por abonado/telefono/operador (contains insensitive)', async () => {
    await service.listar(query({ search: 'robles' }));
    const where = findManyArgs().where as { OR: unknown[] };
    expect(where.OR).toEqual([
      { abonado: { contains: 'robles', mode: 'insensitive' } },
      { telefono: { contains: 'robles', mode: 'insensitive' } },
      { operador: { name: { contains: 'robles', mode: 'insensitive' } } },
    ]);
  });

  it('rango de fechas: fecha gte desde y lte hasta', async () => {
    await service.listar(query({ desde: '2026-07-01', hasta: '2026-07-31' }));
    const where = findManyArgs().where as { fecha: { gte: Date; lte: Date } };
    expect(where.fecha.gte).toEqual(new Date('2026-07-01T00:00:00.000Z'));
    expect(where.fecha.lte).toEqual(new Date('2026-07-31T00:00:00.000Z'));
  });

  it('el filtro resultado se aplica al listado y al total, no a counts', async () => {
    await service.listar(query({ resultado: 'ESCALADO_NOC' }));
    expect((findManyArgs().where as Record<string, unknown>).resultado).toBe(
      'ESCALADO_NOC',
    );
    // groupBy (counts.porResultado) NO debe llevar el filtro resultado.
    expect(groupByArgs().where).not.toHaveProperty('resultado');
  });

  it.each([
    ['fecha', 'asc', [{ fecha: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }]],
    ['operador', 'asc', [{ operador: { name: 'asc' } }, { id: 'asc' }]],
    ['abonado', 'desc', [{ abonado: 'desc' }, { id: 'asc' }]],
    ['resultado', 'asc', [{ resultado: 'asc' }, { id: 'asc' }]],
    ['zona', 'desc', [{ ubicacion: 'desc' }, { id: 'asc' }]],
  ])('ordena por sortKey=%s dir=%s', async (sortKey, sortDir, expected) => {
    await service.listar(
      query({
        sortKey: sortKey as ListGestionesQueryDto['sortKey'],
        sortDir: sortDir as 'asc' | 'desc',
      }),
    );
    expect(findManyArgs().orderBy).toEqual(expected);
  });

  it('devuelve total (filtrado) y counts.total (sin filtro resultado) por separado', async () => {
    const res = await service.listar(query({ resultado: 'ESCALADO_NOC' }));
    expect(res.total).toBe(3); // count con where.resultado
    expect(res.counts.total).toBe(20); // count sin resultado
  });

  it('counts.porResultado incluye los 5 resultados (0 los ausentes)', async () => {
    const res = await service.listar(query());
    expect(res.counts.porResultado).toEqual({
      SOLUCIONADO_MESA: 12,
      ENVIADO_SOPORTE2: 0,
      ESCALADO_NOC: 3,
      PENDIENTE_CLIENTE: 0,
      REAGENDADO: 0,
    });
  });

  it('mapea la fila al item del Historial', async () => {
    const res = await service.listar(query());
    expect(res.items[0]).toEqual({
      id: 'g-1',
      codigo: codigoDeId('g-1'),
      operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
      abonado: 'Cond. Los Robles',
      telefono: '0412-118-4420',
      zona: 'Norte',
      canal: 'TELEGRAM',
      resultado: 'SOLUCIONADO_MESA',
      fecha: '2026-07-17',
      hora: '14:42',
      duracionMin: 12,
      detalle: 'Corte total de fibra',
      solucion: 'Ticket generado a NOC',
    });
  });

  it('degrada campos nullable: canal/duracion null e iniciales de un solo nombre', async () => {
    findMany.mockResolvedValue([
      fila({
        canal: null,
        duracion: null,
        operador: { id: 'op-2', name: 'Ana' },
      }),
    ]);
    const res = await service.listar(query());
    expect(res.items[0].canal).toBeNull();
    expect(res.items[0].duracionMin).toBeNull();
    expect(res.items[0].operador.iniciales).toBe('A');
  });
});

describe('codigoDeId', () => {
  it('es estable y determinista para un mismo id', () => {
    expect(codigoDeId('abc-123')).toBe(codigoDeId('abc-123'));
    expect(codigoDeId('abc-123')).toMatch(/^GST-\d{5}$/);
  });

  it('distingue ids distintos (sin colisión trivial)', () => {
    expect(codigoDeId('a')).not.toBe(codigoDeId('b'));
  });
});
