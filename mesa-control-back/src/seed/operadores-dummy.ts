export interface OperadorDummy {
  email: string;
  name: string;
}

/**
 * Operadores dummy para poblar el select de `/registro` y los dashboards.
 * Emails distintos de los del seed histórico (jhon.rivas, maria.leon, …) para
 * no pisarlos: el upsert por email mantiene ambos conjuntos intactos.
 */
export const OPERADORES_DUMMY: OperadorDummy[] = [
  { email: 'cristhian.rangel@fibex.com', name: 'Cristhian Rangel' },
  { email: 'maria.bastidas@fibex.com', name: 'María Bastidas' },
  { email: 'luis.colmenares@fibex.com', name: 'Luis Colmenares' },
  { email: 'andrea.perez@fibex.com', name: 'Andrea Pérez' },
  { email: 'genesis.marquez@fibex.com', name: 'Génesis Márquez' },
];

/**
 * Argumentos exactos del `upsert` de operador. Al describir la forma concreta que
 * se envía (en vez de `Record<string, unknown>`), este tipo es a la vez un
 * `Prisma.UserUpsertArgs` válido —así el `PrismaClient` real es asignable a
 * `UserUpsertClient` bajo `strictFunctionTypes`— y encaja con el mock laxo del
 * test unitario, que solo lee `where.email`, `create.role`, etc.
 */
export interface OperadorUpsertArgs {
  where: { email: string };
  update: { name: string; role: 'OPERADOR'; isActive: boolean };
  create: {
    email: string;
    name: string;
    role: 'OPERADOR';
    isActive: boolean;
    passwordHash: string;
  };
}

/** Contrato mínimo de Prisma que necesita el sembrado (facilita el test unitario). */
export interface UserUpsertClient {
  user: {
    upsert(args: OperadorUpsertArgs): Promise<{ id: string }>;
  };
}

/**
 * Idempotente: `upsert` por email. Re-ejecutar no duplica ni rompe el seed histórico
 * ni los usuarios ya sembrados; reutiliza el `passwordHash` del seed.
 */
export function sembrarOperadoresDummy(
  prisma: UserUpsertClient,
  passwordHash: string,
): Promise<{ id: string }[]> {
  return Promise.all(
    OPERADORES_DUMMY.map(({ email, name }) =>
      prisma.user.upsert({
        where: { email },
        update: { name, role: 'OPERADOR', isActive: true },
        create: { email, name, role: 'OPERADOR', isActive: true, passwordHash },
      }),
    ),
  );
}
