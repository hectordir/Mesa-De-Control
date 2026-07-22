import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto, PublicUserDto } from './dto/public-user.dto';

/** Hash inerte usado para igualar el tiempo de respuesta cuando el email no existe. */
const DUMMY_HASH =
  '$2b$10$CwTycUXWue0Thq9StjUM0uJ8f1S1sTn4qEXH0oCtNa8gnWaBFmYVy';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private static toPublicUser(user: {
    id: string;
    email: string;
    name: string;
    role: PublicUserDto['role'];
  }): PublicUserDto {
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const email = AuthService.normalizeEmail(dto.email);
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Siempre comparamos contra algo: si el usuario no existe usamos un hash dummy
    // para no filtrar su existencia por el tiempo de respuesta.
    const matches = await bcrypt.compare(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !user.isActive || !matches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const publicUser = AuthService.toPublicUser(user);
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return { accessToken: await this.jwt.signAsync(payload), user: publicUser };
  }

  async validateJwtUser(userId: string): Promise<PublicUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return AuthService.toPublicUser(user);
  }
}
