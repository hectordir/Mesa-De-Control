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
  nombreCliente: 'María Pérez',
  telefono: '0412-118-4420',
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  canal: 'TELEGRAM',
  duracion: 12,
  operador: { id: 'op-1', name: 'Jhon Rivas' },
  updatedAt: null,
  editor: null,
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

  it('search filtra por abonado/cliente/telefono/operador (contains insensitive)', async () => {
    await service.listar(query({ search: 'robles' }));
    const where = findManyArgs().where as { OR: unknown[] };
    expect(where.OR).toEqual([
      { abonado: { contains: 'robles', mode: 'insensitive' } },
      { nombreCliente: { contains: 'robles', mode: 'insensitive' } },
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
    ['nombreCliente', 'asc', [{ nombreCliente: 'asc' }, { id: 'asc' }]],
    ['nombreCliente', 'desc', [{ nombreCliente: 'desc' }, { id: 'asc' }]],
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
      nombreCliente: 'María Pérez',
      telefono: '0412-118-4420',
      zona: 'Norte',
      canal: 'TELEGRAM',
      resultado: 'SOLUCIONADO_MESA',
      fecha: '2026-07-17',
      // createdAt 14:42 UTC = 10:42 en Caracas (UTC−4).
      hora: '10:42',
      duracionMin: 12,
      detalle: 'Corte total de fibra',
      solucion: 'Ticket generado a NOC',
      modificadaFecha: null,
      modificadaHora: null,
      editor: null,
    });
  });

  it('selecciona nombreCliente en el findMany', async () => {
    await service.listar(query());
    const select = findManyArgs().select as Record<string, boolean>;
    expect(select.nombreCliente).toBe(true);
  });

  it('selecciona updatedAt y la relación editor en el findMany', async () => {
    await service.listar(query());
    const select = findManyArgs().select as Record<string, unknown>;
    expect(select.updatedAt).toBe(true);
    expect(select.editor).toEqual({ select: { id: true, name: true } });
  });

  it('sin updatedAt: modificadaFecha/Hora y editor son null', async () => {
    const res = await service.listar(query());
    expect(res.items[0].modificadaFecha).toBeNull();
    expect(res.items[0].modificadaHora).toBeNull();
    expect(res.items[0].editor).toBeNull();
  });

  it('con updatedAt: emite fecha DD/MM/YYYY, hora 12h y editor', async () => {
    findMany.mockResolvedValue([
      fila({
        updatedAt: new Date('2026-07-18T11:47:00.000Z'),
        editor: { id: 'u-9', name: 'Ana Suárez' },
      }),
    ]);
    const res = await service.listar(query());
    // 11:47 UTC = 7:47 en Caracas; el día no cambia.
    expect(res.items[0].modificadaFecha).toBe('18/07/2026');
    expect(res.items[0].modificadaHora).toBe('7:47 a. m.');
    expect(res.items[0].editor).toEqual({ id: 'u-9', nombre: 'Ana Suárez' });
  });

  it('usa el mismo criterio de zona horaria que `hora` (Caracas)', async () => {
    const instante = new Date('2026-07-17T14:42:00.000Z');
    findMany.mockResolvedValue([
      fila({ createdAt: instante, updatedAt: instante }),
    ]);
    const res = await service.listar(query());
    // Mismo instante ⇒ misma hora VE: 10:42 (24h) === 10:42 a. m. (12h).
    expect(res.items[0].hora).toBe('10:42');
    expect(res.items[0].modificadaHora).toBe('10:42 a. m.');
  });

  it('franja 00:00–04:00 UTC: modificadaFecha es el día anterior en Caracas', async () => {
    const madrugada = new Date('2026-01-05T02:30:00.000Z');
    findMany.mockResolvedValue([
      fila({ createdAt: madrugada, updatedAt: madrugada }),
    ]);
    const res = await service.listar(query());
    expect(res.items[0].hora).toBe('22:30');
    expect(res.items[0].modificadaFecha).toBe('04/01/2026');
    expect(res.items[0].modificadaHora).toBe('10:30 p. m.');
  });

  it.each([
    ['2026-01-05T04:00:00.000Z', '12:00 a. m.'],
    ['2026-01-05T04:07:00.000Z', '12:07 a. m.'],
    ['2026-01-05T13:05:00.000Z', '9:05 a. m.'],
    ['2026-01-05T16:00:00.000Z', '12:00 p. m.'],
    ['2026-01-06T03:59:00.000Z', '11:59 p. m.'],
  ])('formatea %s como %s en 12 horas', async (iso, esperado) => {
    findMany.mockResolvedValue([fila({ updatedAt: new Date(iso) })]);
    const res = await service.listar(query());
    expect(res.items[0].modificadaHora).toBe(esperado);
  });

  it('editor borrado (FK SET NULL): emite la fecha con editor null', async () => {
    findMany.mockResolvedValue([
      fila({ updatedAt: new Date('2026-07-18T11:47:00.000Z'), editor: null }),
    ]);
    const res = await service.listar(query());
    expect(res.items[0].modificadaFecha).toBe('18/07/2026');
    expect(res.items[0].modificadaHora).toBe('7:47 a. m.');
    expect(res.items[0].editor).toBeNull();
  });

  // NO-REGRESIÓN: `fecha` es `@db.Date`; Prisma la devuelve como medianoche UTC.
  // Convertirla a Caracas la retrasaría UN DÍA ENTERO.
  it.each([
    ['2026-07-17T00:00:00.000Z', '2026-07-17'],
    ['2026-01-01T00:00:00.000Z', '2026-01-01'],
    ['2015-06-15T00:00:00.000Z', '2015-06-15'],
  ])('la columna `fecha` %s NO se desplaza: %s', async (iso, esperado) => {
    findMany.mockResolvedValue([fila({ fecha: new Date(iso) })]);
    const res = await service.listar(query());
    expect(res.items[0].fecha).toBe(esperado);
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
    expect(codigoDeId('abc-123')).toMatch(/^LG-\d{5}$/);
  });

  it('distingue ids distintos (sin colisión trivial)', () => {
    expect(codigoDeId('a')).not.toBe(codigoDeId('b'));
  });
});
