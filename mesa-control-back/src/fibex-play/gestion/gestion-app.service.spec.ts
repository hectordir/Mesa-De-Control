import { Test, TestingModule } from '@nestjs/testing';

import { GestionAppService } from './gestion-app.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CANALES, MOTIVOS, SOLUCIONES } from './catalogos';
import { CrearAtencionDto } from './dto/crear-atencion.dto';

const count = (n: number) => ({ _count: { _all: n } });

/** Fixture rico: 24 atenciones repartidas para paneles no triviales. */
const CON_DATOS = {
  total: 24,
  porEstado: [
    { estado: 'SOLUCIONADO', ...count(16) },
    { estado: 'EN_PROCESO', ...count(5) },
    { estado: 'ESCALADO', ...count(3) },
  ],
  porCanal: [
    { canal: 'ESPN', ...count(6) },
    { canal: 'Cartoon Network', ...count(5) },
    { canal: 'HBO Max', ...count(4) },
    { canal: 'CNN Español', ...count(3) },
    { canal: 'Discovery', ...count(3) },
    { canal: 'Fox Sports', ...count(3) },
  ],
  porMotivo: [
    { motivo: 'Sin señal', ...count(4) }, // Señal / Transmisión
    { motivo: 'Video congelado', ...count(3) }, // Señal / Transmisión
    { motivo: 'App no carga', ...count(4) }, // App / Login
    { motivo: 'Error de login', ...count(2) }, // App / Login
    { motivo: 'Suscripción vencida', ...count(5) }, // Cuenta / Pago
    { motivo: 'Dispositivo no compatible', ...count(3) }, // Dispositivo
  ],
  registros: [
    {
      id: 'a-2',
      abonado: 'Torre Aurora',
      canal: 'ESPN',
      motivo: 'Sin señal',
      solucion: 'Reinicio de ONU',
      estado: 'SOLUCIONADO',
      creadoEn: new Date('2026-07-22T14:12:00.000Z'),
      operador: { name: 'Jhon Rivas' },
    },
    {
      id: 'a-1',
      abonado: 'Cond. Los Robles',
      canal: 'HBO Max',
      motivo: 'App no carga',
      solucion: 'Reinicio de la app',
      estado: 'EN_PROCESO',
      creadoEn: new Date('2026-07-22T13:52:00.000Z'),
      operador: { name: 'María León' },
    },
  ],
};

const dto = (over: Partial<CrearAtencionDto> = {}): CrearAtencionDto => ({
  operadorId: 'op-1',
  abonado: 'Cond. Los Robles',
  canal: CANALES[0],
  motivo: MOTIVOS[0],
  solucion: SOLUCIONES[0],
  estado: 'SOLUCIONADO',
  ...over,
});

describe('GestionAppService', () => {
  let service: GestionAppService;
  let atCount: jest.Mock;
  let groupBy: jest.Mock;
  let findMany: jest.Mock;
  let create: jest.Mock;
  let findUnique: jest.Mock;

  const setup = async (fixture: Partial<typeof CON_DATOS> = {}) => {
    atCount = jest.fn().mockResolvedValue(fixture.total ?? 0);
    groupBy = jest.fn((args: { by: string[] }) => {
      const key = args.by.join('+');
      if (key === 'estado') return Promise.resolve(fixture.porEstado ?? []);
      if (key === 'canal') return Promise.resolve(fixture.porCanal ?? []);
      if (key === 'motivo') return Promise.resolve(fixture.porMotivo ?? []);
      throw new Error(`groupBy inesperado: ${key}`);
    });
    findMany = jest.fn().mockResolvedValue(fixture.registros ?? []);
    create = jest.fn((args: { data: Record<string, unknown> }) =>
      Promise.resolve({
        id: 'nuevo-1',
        abonado: args.data.abonado,
        canal: args.data.canal,
        motivo: args.data.motivo,
        solucion: args.data.solucion,
        estado: args.data.estado,
        creadoEn: new Date('2026-07-22T15:00:00.000Z'),
        operador: { name: 'Jhon Rivas' },
      }),
    );
    findUnique = jest.fn().mockResolvedValue({ id: 'op-1', role: 'OPERADOR' });

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GestionAppService,
        {
          provide: PrismaService,
          useValue: {
            atencionApp: { count: atCount, groupBy, findMany, create },
            user: { findUnique },
          },
        },
      ],
    }).compile();
    service = moduleRef.get(GestionAppService);
  };

  describe('resumen()', () => {
    it('calcula las KPIs por estado', async () => {
      await setup(CON_DATOS);
      const res = await service.resumen();
      expect(res.kpis).toEqual({
        totalAtendidos: 24,
        solucionados: 16,
        enProceso: 5,
        escalados: 3,
      });
    });

    it('ordena topCanales desc y recorta a top 5', async () => {
      await setup(CON_DATOS);
      const res = await service.resumen();
      expect(res.topCanales).toEqual([
        { canal: 'ESPN', total: 6 },
        { canal: 'Cartoon Network', total: 5 },
        { canal: 'HBO Max', total: 4 },
        { canal: 'CNN Español', total: 3 },
        { canal: 'Discovery', total: 3 },
      ]);
    });

    it('deriva origen desde motivo, agrega por categoría en orden del catálogo (solo total>0)', async () => {
      await setup(CON_DATOS);
      const res = await service.resumen();
      expect(res.origen).toEqual([
        { origen: 'Señal / Transmisión', total: 7 },
        { origen: 'App / Login', total: 6 },
        { origen: 'Cuenta / Pago', total: 5 },
        { origen: 'Dispositivo', total: 3 },
      ]);
    });

    it('lista registros desc por creadoEn con operador como nombre', async () => {
      await setup(CON_DATOS);
      const res = await service.resumen();
      expect(res.registros[0]).toEqual({
        id: 'a-2',
        operador: 'Jhon Rivas',
        abonado: 'Torre Aurora',
        canal: 'ESPN',
        motivo: 'Sin señal',
        solucion: 'Reinicio de ONU',
        estado: 'SOLUCIONADO',
        creadoEn: '2026-07-22T14:12:00.000Z',
      });
      // El service pide a Prisma orden desc por creadoEn.
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { creadoEn: 'desc' } }),
      );
    });

    it('siempre incluye catálogos completos', async () => {
      await setup(CON_DATOS);
      const res = await service.resumen();
      expect(res.catalogos.canales).toEqual([...CANALES]);
      expect(res.catalogos.motivos).toEqual(MOTIVOS);
      expect(res.catalogos.soluciones).toEqual([...SOLUCIONES]);
      expect(res.catalogos.estados).toEqual([
        'SOLUCIONADO',
        'EN_PROCESO',
        'ESCALADO',
      ]);
    });

    it('caso vacío: KPIs en 0, arrays vacíos, catálogos presentes (no 404)', async () => {
      await setup();
      const res = await service.resumen();
      expect(res.kpis).toEqual({
        totalAtendidos: 0,
        solucionados: 0,
        enProceso: 0,
        escalados: 0,
      });
      expect(res.topCanales).toEqual([]);
      expect(res.origen).toEqual([]);
      expect(res.registros).toEqual([]);
      expect(res.catalogos.canales).toHaveLength(10);
    });
  });

  describe('crear()', () => {
    it('rechaza (400) si el operadorId no existe', async () => {
      await setup(CON_DATOS);
      findUnique.mockResolvedValue(null);
      await expect(
        service.crear(dto({ operadorId: 'nope' })),
      ).rejects.toThrow();
      expect(create).not.toHaveBeenCalled();
    });

    it('persiste y devuelve el registro con la forma de un item', async () => {
      await setup(CON_DATOS);
      const res = await service.crear(dto({ abonado: 'Cuenta 100482' }));
      const args = create.mock.calls[0] as [{ data: Record<string, unknown> }];
      expect(args[0].data).toMatchObject({
        operadorId: 'op-1',
        abonado: 'Cuenta 100482',
        canal: CANALES[0],
        estado: 'SOLUCIONADO',
      });
      expect(res).toEqual({
        id: 'nuevo-1',
        operador: 'Jhon Rivas',
        abonado: 'Cuenta 100482',
        canal: CANALES[0],
        motivo: MOTIVOS[0],
        solucion: SOLUCIONES[0],
        estado: 'SOLUCIONADO',
        creadoEn: '2026-07-22T15:00:00.000Z',
      });
    });
  });
});
