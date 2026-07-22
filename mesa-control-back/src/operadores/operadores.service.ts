import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { OperadorOptionDto } from './dto/operador-option.dto';

@Injectable()
export class OperadoresService {
  constructor(private readonly prisma: PrismaService) {}

  /** Usuarios con rol OPERADOR, ordenados por nombre, como {id, nombre}. */
  async listar(): Promise<OperadorOptionDto[]> {
    const operadores = await this.prisma.user.findMany({
      where: { role: 'OPERADOR' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return operadores.map((o) => ({ id: o.id, nombre: o.name }));
  }
}
