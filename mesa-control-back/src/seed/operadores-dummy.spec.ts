import { OPERADORES_DUMMY, sembrarOperadoresDummy } from './operadores-dummy';

type UpsertArg = {
  where: { email: string };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
};

describe('operadores dummy', () => {
  it('define varios operadores con email y nombre únicos', () => {
    expect(OPERADORES_DUMMY.length).toBeGreaterThanOrEqual(4);
    const emails = OPERADORES_DUMMY.map((o) => o.email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const o of OPERADORES_DUMMY) {
      expect(o.email).toMatch(/@fibex\.com$/);
      expect(o.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('hace upsert por email (idempotente) con rol OPERADOR y el hash recibido', async () => {
    const upsert = jest.fn((arg: UpsertArg) =>
      Promise.resolve({ id: `id-${arg.where.email}` }),
    );
    const prisma = { user: { upsert } };

    await sembrarOperadoresDummy(prisma, 'hash-x');

    expect(upsert).toHaveBeenCalledTimes(OPERADORES_DUMMY.length);
    for (const [arg] of upsert.mock.calls) {
      expect(arg.where.email).toBeDefined();
      expect(arg.create.role).toBe('OPERADOR');
      expect(arg.create.passwordHash).toBe('hash-x');
      expect(arg.update.role).toBe('OPERADOR');
    }
  });

  it('re-ejecutar no cambia el conjunto de upserts (mismos emails, no duplica)', async () => {
    const upsert = jest.fn((arg: UpsertArg) =>
      Promise.resolve({ id: arg.where.email }),
    );
    const prisma = { user: { upsert } };

    await sembrarOperadoresDummy(prisma, 'h');
    await sembrarOperadoresDummy(prisma, 'h');

    const n = OPERADORES_DUMMY.length;
    const primera = upsert.mock.calls.slice(0, n).map(([a]) => a.where.email);
    const segunda = upsert.mock.calls.slice(n).map(([a]) => a.where.email);
    expect(segunda).toEqual(primera);
  });
});
