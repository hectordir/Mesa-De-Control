import * as bcrypt from 'bcrypt';

import {
  AdminUserClient,
  bootstrapAdmin,
  leerCredencialesAdmin,
} from './bootstrap-admin';

interface UsuarioFake {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  passwordHash: string;
}

/** Cliente Prisma en memoria: una tabla `user` con unicidad por email. */
function clienteFake(iniciales: UsuarioFake[] = []): AdminUserClient & {
  filas: UsuarioFake[];
} {
  const filas = [...iniciales];
  return {
    filas,
    user: {
      findUnique: ({ where }) =>
        Promise.resolve(filas.find((f) => f.email === where.email) ?? null),
      create: ({ data }) => {
        const fila: UsuarioFake = { id: `id-${filas.length + 1}`, ...data };
        filas.push(fila);
        return Promise.resolve(fila);
      },
    },
  };
}

describe('leerCredencialesAdmin', () => {
  it('falla con mensaje claro si falta ADMIN_EMAIL o ADMIN_PASSWORD', () => {
    expect(() =>
      leerCredencialesAdmin({ ADMIN_PASSWORD: 'secreto123' }),
    ).toThrow(/ADMIN_EMAIL/);
    expect(() =>
      leerCredencialesAdmin({ ADMIN_EMAIL: 'admin@fibex.com' }),
    ).toThrow(/ADMIN_PASSWORD/);
    expect(() => leerCredencialesAdmin({})).toThrow(
      /ADMIN_EMAIL.*ADMIN_PASSWORD/,
    );
  });

  it('falla si la contraseña tiene menos de 8 caracteres', () => {
    expect(() =>
      leerCredencialesAdmin({
        ADMIN_EMAIL: 'admin@fibex.com',
        ADMIN_PASSWORD: 'corta7',
      }),
    ).toThrow(/8/);
  });

  it('normaliza el email y usa un nombre por defecto', () => {
    expect(
      leerCredencialesAdmin({
        ADMIN_EMAIL: '  Admin@Fibex.com ',
        ADMIN_PASSWORD: 'secreto123',
      }),
    ).toEqual({
      email: 'admin@fibex.com',
      password: 'secreto123',
      name: 'Administrador',
    });
  });

  it('respeta ADMIN_NAME si viene definido', () => {
    expect(
      leerCredencialesAdmin({
        ADMIN_EMAIL: 'admin@fibex.com',
        ADMIN_PASSWORD: 'secreto123',
        ADMIN_NAME: 'Hector',
      }).name,
    ).toBe('Hector');
  });
});

describe('bootstrapAdmin', () => {
  const env = { ADMIN_EMAIL: 'admin@fibex.com', ADMIN_PASSWORD: 'secreto123' };

  it('crea el usuario ADMIN con la contraseña hasheada con bcrypt', async () => {
    const prisma = clienteFake();

    const resultado = await bootstrapAdmin(prisma, env);

    expect(resultado.estado).toBe('creado');
    expect(prisma.filas).toHaveLength(1);
    const [admin] = prisma.filas;
    expect(admin).toMatchObject({
      email: 'admin@fibex.com',
      role: 'ADMIN',
      isActive: true,
    });
    expect(admin.passwordHash).not.toBe('secreto123');
    await expect(
      bcrypt.compare('secreto123', admin.passwordHash),
    ).resolves.toBe(true);
  });

  it('es idempotente: la segunda ejecución no duplica ni sobrescribe', async () => {
    const prisma = clienteFake();

    await bootstrapAdmin(prisma, env);
    const hashOriginal = prisma.filas[0].passwordHash;
    const resultado = await bootstrapAdmin(prisma, env);

    expect(resultado.estado).toBe('existente');
    expect(prisma.filas).toHaveLength(1);
    expect(prisma.filas[0].passwordHash).toBe(hashOriginal);
  });

  it('no degrada ni pisa a un usuario existente que no es ADMIN', async () => {
    const prisma = clienteFake([
      {
        id: 'id-1',
        email: 'admin@fibex.com',
        name: 'Operador Previo',
        role: 'OPERADOR',
        isActive: true,
        passwordHash: 'hash-previo',
      },
    ]);

    const resultado = await bootstrapAdmin(prisma, env);

    expect(resultado.estado).toBe('existente');
    expect(resultado.mensaje).toMatch(/OPERADOR/);
    expect(prisma.filas).toEqual([
      expect.objectContaining({
        role: 'OPERADOR',
        name: 'Operador Previo',
        passwordHash: 'hash-previo',
      }),
    ]);
  });

  it('no escribe en la base si las credenciales son inválidas', async () => {
    const prisma = clienteFake();

    await expect(
      bootstrapAdmin(prisma, { ADMIN_EMAIL: 'admin@fibex.com' }),
    ).rejects.toThrow(/ADMIN_PASSWORD/);
    expect(prisma.filas).toHaveLength(0);
  });
});
