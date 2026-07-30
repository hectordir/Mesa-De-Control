/**
 * Crea el primer usuario ADMIN a partir de ADMIN_EMAIL / ADMIN_PASSWORD.
 * Ejecución única e idempotente (`npm run bootstrap:admin`); NO es el seed de demo,
 * que está prohibido en producción.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { pgAdapterOptions } from '../src/prisma/prisma-connection';
import { bootstrapAdmin } from '../src/seed/bootstrap-admin';

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pgAdapterOptions(process.env.DATABASE_URL)),
  });

  try {
    const resultado = await bootstrapAdmin(prisma, process.env);
    console.log(resultado.mensaje);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(
    `bootstrap:admin falló → ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exit(1);
});
