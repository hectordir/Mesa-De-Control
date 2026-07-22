import { Test, TestingModule } from '@nestjs/testing';

import { OperadoresService } from './operadores.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OperadoresService', () => {
  let service: OperadoresService;
  let findMany: jest.Mock;

  beforeEach(async () => {
    findMany = jest.fn().mockResolvedValue([
      { id: 'a', name: 'Ana Pérez' },
      { id: 'b', name: 'Beto Ruiz' },
    ]);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OperadoresService,
        { provide: PrismaService, useValue: { user: { findMany } } },
      ],
    }).compile();
    service = moduleRef.get(OperadoresService);
  });

  it('lista solo rol OPERADOR, ordenados por nombre, mapeando a {id, nombre}', async () => {
    const res = await service.listar();

    expect(findMany).toHaveBeenCalledWith({
      where: { role: 'OPERADOR' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    expect(res).toEqual([
      { id: 'a', nombre: 'Ana Pérez' },
      { id: 'b', nombre: 'Beto Ruiz' },
    ]);
  });
});
