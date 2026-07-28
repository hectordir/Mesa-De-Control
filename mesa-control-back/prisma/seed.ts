import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { sembrarAtenciones } from '../src/seed/atenciones';
import { sembrarCanales } from '../src/seed/canales';
import { diaLocal } from '../src/seed/dia';
import { construirGestionesDemo } from '../src/seed/gestiones-demo';
import { construirGestionesMensuales } from '../src/seed/gestiones-mensuales';
import { sembrarOperadoresDummy } from '../src/seed/operadores-dummy';
import { construirSupervisionDemo } from '../src/seed/supervision-demo';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL as string }),
});

const PASSWORD = 'Fibex2026!';
/** Filas por `createMany` de la historia mensual. */
const LOTE = 1000;

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

/**
 * Rellena `canal`/`duracion` en filas históricas que ya existían antes de
 * añadir estas columnas (el `createMany` con `skipDuplicates` no las actualiza).
 * Idempotente: solo toca filas con `canal IS NULL`. Agrupa por (canal, duracion)
 * — pocas combinaciones — para hacer un puñado de `updateMany` en vez de miles.
 */
async function backfillCanalDuracion(
  filas: { id: string; canal: string; duracion: number }[],
): Promise<number> {
  const grupos = new Map<string, string[]>();
  for (const f of filas) {
    const clave = `${f.canal}|${f.duracion}`;
    (grupos.get(clave) ?? grupos.set(clave, []).get(clave)!).push(f.id);
  }

  let actualizadas = 0;
  for (const [clave, ids] of grupos) {
    const [canal, duracion] = clave.split('|');
    const { count } = await prisma.gestion.updateMany({
      where: { id: { in: ids }, canal: null },
      data: { canal: canal as never, duracion: Number(duracion) },
    });
    actualizadas += count;
  }
  return actualizadas;
}

/**
 * Canal/duración deterministas a partir del id (hash FNV-1a) para filas demo de
 * días ya cerrados que ninguna generación vigente vuelve a producir (p.ej. el
 * seed diario de ayer). Estable: el mismo id da siempre lo mismo.
 */
function canalDuracionDeId(id: string): { canal: string; duracion: number } {
  let h = 0x811c9dc5;
  for (const c of id) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  const n = h >>> 0;
  const canales = ['LLAMADA', 'WHATSAPP', 'TELEGRAM'];
  return { canal: canales[n % 3], duracion: 2 + (n % 29) };
}

/**
 * Cierra cualquier fila demo (`seed-%`/`mensual-%`) que siga con `canal IS NULL`
 * tras el backfill principal —típicamente jornadas diarias de días anteriores—.
 * Nunca toca gestiones reales (ids uuid). Idempotente.
 */
async function backfillDemoRestantes(): Promise<number> {
  const pendientes = await prisma.gestion.findMany({
    where: {
      canal: null,
      OR: [
        { id: { startsWith: 'seed-' } },
        { id: { startsWith: 'mensual-' } },
        { id: { startsWith: 'sup-' } },
      ],
    },
    select: { id: true },
  });

  let actualizadas = 0;
  for (const { id } of pendientes) {
    const { canal, duracion } = canalDuracionDeId(id);
    const { count } = await prisma.gestion.updateMany({
      where: { id, canal: null },
      data: { canal: canal as never, duracion },
    });
    actualizadas += count;
  }
  return actualizadas;
}

/**
 * Rellena `abonado` en las filas demo de HOY que aún lo tengan vacío (creadas
 * antes de que el builder lo poblara; `skipDuplicates` no actualiza). Idempotente:
 * solo toca `abonado = ''`. Agrupa por el valor destino para hacer pocos
 * `updateMany` en vez de uno por fila. No toca gestiones reales ni el histórico.
 */
async function backfillAbonado(
  filas: { id: string; abonado: string }[],
): Promise<number> {
  const grupos = new Map<string, string[]>();
  for (const f of filas) {
    (grupos.get(f.abonado) ?? grupos.set(f.abonado, []).get(f.abonado)!).push(
      f.id,
    );
  }

  let actualizadas = 0;
  for (const [abonado, ids] of grupos) {
    const { count } = await prisma.gestion.updateMany({
      where: { id: { in: ids }, abonado: '' },
      data: { abonado },
    });
    actualizadas += count;
  }
  return actualizadas;
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

  // Staff con rol elevado para gatear Admin · Supervisión (RBAC). Idempotente
  // (upsert por email). El ADMIN es el usuario demo del diseño.
  const staff = [
    { email: 'admin@fibex.com', name: 'Admin Fibex', role: 'ADMIN' as const },
    {
      email: 'supervisor@fibex.com',
      name: 'Supervisor Fibex',
      role: 'SUPERVISOR' as const,
    },
  ];
  await Promise.all(
    staff.map(({ email, name, role }) =>
      prisma.user.upsert({
        where: { email },
        update: { name, role, isActive: true },
        create: { email, name, role, isActive: true, passwordHash },
      }),
    ),
  );

  // Operadores dummy (§9.2): pueblan el select de /registro. Idempotente (upsert
  // por email); no participan en las gestiones demo/mensuales.
  const dummies = await sembrarOperadoresDummy(prisma, passwordHash);

  // Todo el seed pivota sobre ESTE instante: el mismo "hoy" para el monitor
  // diario, supervisión, la historia mensual, la grilla y la bitácora.
  const ahora = new Date();
  const fecha = diaLocal(ahora);
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

  // Rellena el abonado de las filas de hoy que se crearon con abonado vacío
  // (alimentan la lista de Depuración de Supervisión).
  const abonadosHoy = await backfillAbonado(gestiones);
  if (abonadosHoy > 0) {
    console.log(`Seed depuración — ${abonadosHoy} abonados rellenados hoy`);
  }

  // Admin · Supervisión: gestiones de hoy en las 10 zonas de La Guaira + escaladas
  // abiertas de 1–5 días (Bandeja N2, SLA, mapa). Idempotente (ids `sup-…` fijos).
  const supervisionGestiones = construirSupervisionDemo(
    fecha,
    usuarios.map((u) => u.id),
  );
  const { count: nuevasSupervision } = await prisma.gestion.createMany({
    data: supervisionGestiones,
    skipDuplicates: true,
  });
  console.log(
    `Seed supervisión — ${supervisionGestiones.length} gestiones generadas · ${nuevasSupervision} nuevas en base`,
  );

  // Historia mensual del Análisis Mensual: 4 meses cerrados + el mes en curso
  // hasta ayer. No toca el día de hoy, así que el Monitor Diario no cambia.
  const mensuales = construirGestionesMensuales(
    ahora,
    usuarios.filter((u) => u.email !== 'operador@fibex.com').map((u) => u.id),
  );
  // En lotes: un solo INSERT de miles de filas roza el límite de parámetros de Postgres.
  let nuevasMensuales = 0;
  for (let i = 0; i < mensuales.length; i += LOTE) {
    const { count: nuevas } = await prisma.gestion.createMany({
      data: mensuales.slice(i, i + LOTE),
      skipDuplicates: true,
    });
    nuevasMensuales += nuevas;
  }

  console.log(
    `Seed OK — ${usuarios.length} usuarios · ${dummies.length} operadores dummy · ${count} gestiones nuevas · ${total} gestiones el ${fecha}`,
  );
  console.log(
    `Seed mensual — ${mensuales.length} gestiones generadas · ${nuevasMensuales} nuevas en base`,
  );

  // Backfill de canal/duracion en filas históricas anteriores a estas columnas.
  const backfilled = await backfillCanalDuracion([...gestiones, ...mensuales]);
  const restantes = await backfillDemoRestantes();
  console.log(
    `Seed historial — ${backfilled} filas pobladas · ${restantes} demo restantes cerradas`,
  );

  // Grilla Fibex Play: 165 canales (6 caídos HOY). Idempotente (ids fijos +
  // skipDuplicates) y con refresco de `detectadoEn` al día en curso.
  const { count: nuevosCanales, actualizadas: caidasHoy } =
    await sembrarCanales(prisma, ahora);
  const totalCanales = await prisma.canal.count();
  console.log(
    `Seed canales — ${nuevosCanales} nuevos · ${caidasHoy} caídas fechadas hoy · ${totalCanales} canales en base`,
  );

  // Fibex Play · Gestión: 24 atenciones ligadas a operadores ya sembrados
  // (por id, buscados por email). Idempotente (ids fijos + skipDuplicates).
  const operadorIds = usuarios
    .filter((u) => u.email !== 'operador@fibex.com')
    .map((u) => u.id);
  const { count: nuevasAtenciones, actualizadas: atencionesHoy } =
    await sembrarAtenciones(prisma, operadorIds, ahora);
  const totalAtenciones = await prisma.atencionApp.count();
  console.log(
    `Seed atenciones — ${nuevasAtenciones} nuevas · ${atencionesHoy} fechadas hoy · ${totalAtenciones} atenciones en base`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
