import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { GestionService } from './gestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGestionDto } from './dto/create-gestion.dto';

/** Fila que devolvería `prisma.gestion.create` (con la relación `operador`). */
const filaCreada = (over: Record<string, unknown> = {}) => ({
  id: 'g-1',
  operadorId: 'op-1',
  resultado: 'SOLUCIONADO_MESA',
  motivo: 'Corte de fibra',
  ubicacion: 'Caraballeda',
  fecha: new Date('2026-07-22T00:00:00.000Z'),
  createdAt: new Date('2026-07-22T10:42:00.000Z'),
  abonado: 'Cond. Los Robles',
  telefono: '0412 555 1234',
  detalle: 'Sin Internet',
  solucion: 'Reinicio de ONU',
  tipo: 'Mesa',
  requiereVisita: false,
  observacion: 'Cliente notificado',
  coordenadas: '10.6012, -66.9311',
  operador: { id: 'op-1', name: 'Operador Demo' },
  ...over,
});

const dto = (over: Partial<CreateGestionDto> = {}): CreateGestionDto => ({
  operadorId: 'op-1',
  fecha: '2026-07-22',
  abonado: 'Cond. Los Robles',
  nombreCliente: 'María Pérez',
  telefono: '0412 555 1234',
  detalle: 'Sin Internet',
  solucion: 'Reinicio de ONU',
  resultado: 'SOLUCIONADO_MESA',
  tipo: 'Mesa',
  requiereVisita: false,
  zona: 'Caraballeda',
  motivo: 'Corte de fibra',
  observacion: 'Cliente notificado',
  coordenadas: '10.6012, -66.9311',
  ...over,
});

/** `data` del enésimo llamado a `create`/`update`, tipado para evitar `any`. */
const dataDe = (create: jest.Mock, i = 0): Record<string, unknown> => {
  const args = create.mock.calls[i] as [{ data: Record<string, unknown> }];
  return args[0].data;
};

describe('GestionService', () => {
  let service: GestionService;
  let create: jest.Mock;
  let findUnique: jest.Mock;

  const setup = async () => {
    create = jest.fn((args: { data: Record<string, unknown> }) =>
      Promise.resolve(filaCreada(args.data)),
    );
    findUnique = jest.fn().mockResolvedValue({ id: 'op-1', role: 'OPERADOR' });
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GestionService,
        {
          provide: PrismaService,
          useValue: { user: { findUnique }, gestion: { create } },
        },
      ],
    }).compile();
    service = moduleRef.get(GestionService);
  };

  beforeEach(setup);

  it('normaliza `fecha` a medianoche UTC y mapea `zona` → `ubicacion`', async () => {
    await service.crear(dto({ zona: 'Macuto', fecha: '2026-03-05' }));

    const data = dataDe(create);
    expect(data.ubicacion).toBe('Macuto');
    expect(data.zona).toBeUndefined();
    expect(data.fecha).toEqual(new Date('2026-03-05T00:00:00.000Z'));
    expect((data.fecha as Date).toISOString()).toBe('2026-03-05T00:00:00.000Z');
  });

  it('persiste con el operadorId del body (autoría elegida)', async () => {
    findUnique.mockResolvedValue({ id: 'op-99', role: 'OPERADOR' });
    await service.crear(dto({ operadorId: 'op-99' }));
    expect(dataDe(create).operadorId).toBe('op-99');
  });

  it('rechaza (400) si el operadorId no existe', async () => {
    findUnique.mockResolvedValue(null);
    await expect(service.crear(dto({ operadorId: 'nope' }))).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it('rechaza (400) si el operadorId no es un OPERADOR', async () => {
    findUnique.mockResolvedValue({ id: 'sup-1', role: 'SUPERVISOR' });
    await expect(service.crear(dto({ operadorId: 'sup-1' }))).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it('aplica requiereVisita=false por defecto cuando no se envía', async () => {
    await service.crear(dto({ requiereVisita: undefined }));
    expect(dataDe(create).requiereVisita).toBe(false);
  });

  it('persiste nombreCliente y lo devuelve en la respuesta', async () => {
    const res = await service.crear(dto({ nombreCliente: 'Ana Quintero' }));

    expect(dataDe(create).nombreCliente).toBe('Ana Quintero');
    expect(res.nombreCliente).toBe('Ana Quintero');
  });

  it('persiste telefono y lo devuelve en la respuesta', async () => {
    const res = await service.crear(dto({ telefono: '0414-118-4420' }));

    expect(dataDe(create).telefono).toBe('0414-118-4420');
    expect(res.telefono).toBe('0414-118-4420');
  });

  it('devuelve el contrato GestionResponse con operador {id, nombre}', async () => {
    const res = await service.crear(dto());

    expect(res.operador).toEqual({ id: 'op-1', nombre: 'Operador Demo' });
    expect(res.zona).toBe('Caraballeda');
    expect(res.fecha).toBe('2026-07-22');
    expect(res.createdAt).toBe('2026-07-22T10:42:00.000Z');
    expect(res).not.toHaveProperty('ubicacion');
    expect(res).not.toHaveProperty('operadorId');
  });
});

describe('GestionService · obtener / actualizar', () => {
  let service: GestionService;
  let update: jest.Mock;
  let gestionFindUnique: jest.Mock;
  let userFindUnique: jest.Mock;

  /** Fila persistida (sin editar todavía). */
  const filaExistente = (over: Record<string, unknown> = {}) =>
    filaCreada({
      nombreCliente: 'María Pérez',
      updatedAt: null,
      updatedBy: null,
      ...over,
    });

  const setup = async () => {
    gestionFindUnique = jest.fn().mockResolvedValue(filaExistente());
    update = jest.fn((args: { data: Record<string, unknown> }) =>
      Promise.resolve(filaExistente(args.data)),
    );
    userFindUnique = jest
      .fn()
      .mockResolvedValue({ id: 'op-1', role: 'OPERADOR' });
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GestionService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: userFindUnique },
            gestion: { findUnique: gestionFindUnique, update },
          },
        },
      ],
    }).compile();
    service = moduleRef.get(GestionService);
  };

  beforeEach(setup);

  it('obtener devuelve el detalle completo con codigo LG-#####', async () => {
    const res = await service.obtener('g-1');

    expect(res.id).toBe('g-1');
    expect(res.codigo).toMatch(/^LG-\d{5}$/);
    expect(res.tipo).toBe('Mesa');
    expect(res.motivo).toBe('Corte de fibra');
    expect(res.observacion).toBe('Cliente notificado');
    expect(res.requiereVisita).toBe(false);
    expect(res.coordenadas).toBe('10.6012, -66.9311');
    expect(res.updatedAt).toBeNull();
    expect(res.updatedBy).toBeNull();
  });

  it('obtener lanza 404 si el id no existe', async () => {
    gestionFindUnique.mockResolvedValue(null);
    await expect(service.obtener('nope')).rejects.toThrow(NotFoundException);
  });

  it('actualizar escribe updatedAt/updatedBy del token y no toca createdAt/id', async () => {
    const antes = Date.now();
    const res = await service.actualizar('g-1', { motivo: 'Otro' }, 'sup-1');
    const data = dataDe(update);

    expect(data.motivo).toBe('Otro');
    expect(data.updatedBy).toBe('sup-1');
    expect(data.updatedAt).toBeInstanceOf(Date);
    expect((data.updatedAt as Date).getTime()).toBeGreaterThanOrEqual(antes);
    expect(data).not.toHaveProperty('createdAt');
    expect(data).not.toHaveProperty('id');
    expect(res.id).toBe('g-1');
  });

  it('actualizar ignora updatedBy si llega en el body (autoría del token)', async () => {
    await service.actualizar(
      'g-1',
      { motivo: 'Otro', updatedBy: 'hacker' } as never,
      'sup-1',
    );
    expect(dataDe(update).updatedBy).toBe('sup-1');
  });

  it('actualizar solo envía los campos presentes (parcial)', async () => {
    await service.actualizar('g-1', { observacion: 'Nueva nota' }, 'sup-1');
    const data = dataDe(update);

    expect(data.observacion).toBe('Nueva nota');
    expect(data).not.toHaveProperty('abonado');
    expect(data).not.toHaveProperty('operadorId');
    expect(data).not.toHaveProperty('resultado');
  });

  it('actualizar mapea zona → ubicacion y normaliza fecha a medianoche UTC', async () => {
    await service.actualizar(
      'g-1',
      { zona: 'Macuto', fecha: '2026-03-05' },
      'sup-1',
    );
    const data = dataDe(update);

    expect(data.ubicacion).toBe('Macuto');
    expect(data).not.toHaveProperty('zona');
    expect(data.fecha).toEqual(new Date('2026-03-05T00:00:00.000Z'));
  });

  it('actualizar acepta operadorId válido (rol OPERADOR)', async () => {
    userFindUnique.mockResolvedValue({ id: 'op-9', role: 'OPERADOR' });
    await service.actualizar('g-1', { operadorId: 'op-9' }, 'sup-1');
    expect(dataDe(update).operadorId).toBe('op-9');
  });

  it('actualizar rechaza (400) un operadorId que no es OPERADOR', async () => {
    userFindUnique.mockResolvedValue({ id: 'sup-2', role: 'SUPERVISOR' });
    await expect(
      service.actualizar('g-1', { operadorId: 'sup-2' }, 'sup-1'),
    ).rejects.toThrow(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('actualizar lanza 404 si el id no existe', async () => {
    gestionFindUnique.mockResolvedValue(null);
    await expect(
      service.actualizar('nope', { motivo: 'x' }, 'sup-1'),
    ).rejects.toThrow(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });

  it('actualizar devuelve updatedAt/updatedBy en la respuesta', async () => {
    update.mockResolvedValue(
      filaExistente({
        updatedAt: new Date('2026-07-28T12:00:00.000Z'),
        updatedBy: 'sup-1',
      }),
    );
    const res = await service.actualizar('g-1', { motivo: 'Otro' }, 'sup-1');

    expect(res.updatedAt).toBe('2026-07-28T12:00:00.000Z');
    expect(res.updatedBy).toBe('sup-1');
  });
});
