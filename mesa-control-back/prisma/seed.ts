import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

async function main() {
  const email = 'operador@fibex.com';
  const passwordHash = await bcrypt.hash('Fibex2026!', 10);

  // Idempotente: se puede correr N veces sin duplicar ni romper.
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: 'Operador Demo', role: 'OPERADOR', isActive: true },
    create: { email, name: 'Operador Demo', role: 'OPERADOR', isActive: true, passwordHash },
  });

  console.log(`Seed OK — usuario ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
