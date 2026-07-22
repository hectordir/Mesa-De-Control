import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { construirGestionesDemo } from '../src/seed/gestiones-demo';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const PASSWORD = 'Fibex2026!';

/**
 * Operadores demo. `reparto` son sus gestiones por resultado, en el orden
 * SOLUCIONADO_MESA / ENVIADO_SOPORTE2 / ESCALADO_NOC / PENDIENTE_CLIENTE / REAGENDADO:
 * las filas dan 78/66/59/71/68 y las columnas los 198/54/31/38/21 del diseño.
 */
const OPERADORES = [
  { email: 'operador@fibex.com', name: 'Operador Demo', reparto: [0, 0, 0, 0, 0] },
  { email: 'jhon.rivas@fibex.com', name: 'Jhon Rivas', reparto: [46, 12, 7, 9, 4] },
  { email: 'maria.leon@fibex.com', name: 'María León', reparto: [38, 10, 6, 8, 4] },
  { email: 'carlos.diaz@fibex.com', name: 'Carlos Díaz', reparto: [33, 10, 6, 7, 3] },
  { email: 'ana.quintero@fibex.com', name: 'Ana Quintero', reparto: [41, 11, 6, 8, 5] },
  { email: 'luis.parra@fibex.com', name: 'Luis Parra', reparto: [40, 11, 6, 6, 5] },
];

/** Día de hoy (zona del servidor) como YYYY-MM-DD. */
function hoy(): string {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mes}-${dia}`;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Idempotente: se puede correr N veces sin duplicar ni romper.
  const usuarios = await Promise.all(
    OPERADORES.map(({ email, name }) =>
      prisma.user.upsert({
        where: { email },
        update: { name, role: 'OPERADOR', isActive: true },
        create: { email, name, role: 'OPERADOR', isActive: true, passwordHash },
      }),
    ),
  );

  const fecha = hoy();
  const gestiones = construirGestionesDemo(
    fecha,
    OPERADORES.map(({ reparto }, i) => ({ id: usuarios[i].id, reparto })),
  );

  // Los ids son deterministas e incluyen el día: correr el seed dos veces el mismo
  // día no crea nada nuevo (`skipDuplicates`), y otro día genera su propia jornada.
  const { count } = await prisma.gestion.createMany({
    data: gestiones,
    skipDuplicates: true,
  });

  const total = await prisma.gestion.count({
    where: { fecha: new Date(`${fecha}T00:00:00.000Z`) },
  });

  console.log(
    `Seed OK — ${usuarios.length} usuarios · ${count} gestiones nuevas · ${total} gestiones el ${fecha}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
