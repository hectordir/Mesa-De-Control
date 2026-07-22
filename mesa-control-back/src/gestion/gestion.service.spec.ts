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

/** `data` del enésimo llamado a `create`, tipado para evitar `any`. */
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
