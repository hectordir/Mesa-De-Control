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

/** Contrato mínimo de Prisma que necesita el sembrado (facilita el test unitario). */
export interface UserUpsertClient {
  user: {
    upsert(args: {
      where: { email: string };
      update: Record<string, unknown>;
      create: Record<string, unknown>;
    }): Promise<{ id: string }>;
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
