import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';
import { sembrarAtenciones } from '../src/seed/atenciones';
import {
  FilaDemo,
  ParcheDemo,
  planBackfillDemo,
  PREFIJOS_DEMO,
} from '../src/seed/backfill-demo';
import { sembrarCanales } from '../src/seed/canales';
import { diaLocal } from '../src/seed/dia';
import { construirEneroDemo } from '../src/seed/enero-demo';
import { construirGestionesDemo } from '../src/seed/gestiones-demo';
import { construirGestionesMensuales } from '../src/seed/gestiones-mensuales';
import { sembrarOperadoresDummy } from '../src/seed/operadores-dummy';
import { construirSupervisionDemo } from '../src/seed/supervision-demo';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
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
  {
    email: 'operador@fibex.com',
    name: 'Operador Demo',
    reparto: [0, 0, 0, 0, 0],
  },
  {
    email: 'jhon.rivas@fibex.com',
    name: 'Jhon Rivas',
    reparto: [46, 12, 7, 9, 4],
  },
  {
    email: 'maria.leon@fibex.com',
    name: 'María León',
    reparto: [38, 10, 6, 8, 4],
  },
  {
    email: 'carlos.diaz@fibex.com',
    name: 'Carlos Díaz',
    reparto: [33, 10, 6, 7, 3],
  },
  {
    email: 'ana.quintero@fibex.com',
    name: 'Ana Quintero',
    reparto: [41, 11, 6, 8, 5],
  },
  {
    email: 'luis.parra@fibex.com',
    name: 'Luis Parra',
    reparto: [40, 11, 6, 6, 5],
  },
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

/** Sentencias por transacción al aplicar el plan de backfill demo. */
const LOTE_SENTENCIAS = 500;

/**
 * Homologa las filas demo ya persistidas: `abonado` pasa de zona a identificador
 * Fibex y se rellenan `detalle`/`solucion`/`tipo`/`observacion` vacíos (el
 * `createMany({ skipDuplicates })` nunca actualiza lo existente, así que las
 * jornadas de días anteriores se quedaron atrás). El plan lo calcula
 * `planBackfillDemo` —convergente y solo sobre ids del seed—; aquí solo se
 * ejecuta, agrupando parches idénticos y en transacciones por lotes.
 */
async function backfillDemo(
  generadas: readonly FilaDemo[],
): Promise<{ filas: number; escrituras: number }> {
  const existentes = await prisma.gestion.findMany({
    where: { OR: PREFIJOS_DEMO.map((p) => ({ id: { startsWith: p } })) },
    select: {
      id: true,
      abonado: true,
      detalle: true,
      solucion: true,
      tipo: true,
      observacion: true,
    },
  });

  const plan = planBackfillDemo(existentes, generadas);

  const grupos = new Map<
    string,
    { datos: ParcheDemo['datos']; ids: string[] }
  >();
  for (const { id, datos } of plan) {
    const clave = JSON.stringify(datos);
    const grupo = grupos.get(clave) ?? { datos, ids: [] };
    grupo.ids.push(id);
    grupos.set(clave, grupo);
  }

  const sentencias = [...grupos.values()].flatMap(({ datos, ids }) =>
    Array.from({ length: Math.ceil(ids.length / LOTE) }, (_, i) =>
      prisma.gestion.updateMany({
        where: { id: { in: ids.slice(i * LOTE, (i + 1) * LOTE) } },
        data: datos,
      }),
    ),
  );

  let escrituras = 0;
  for (let i = 0; i < sentencias.length; i += LOTE_SENTENCIAS) {
    const res = await prisma.$transaction(
      sentencias.slice(i, i + LOTE_SENTENCIAS),
    );
    escrituras += res.reduce((a, r) => a + r.count, 0);
  }

  return { filas: plan.length, escrituras };
}

/**
 * Rellena `nombreCliente` en filas demo que ya existían antes de la columna
 * (`skipDuplicates` no actualiza). Idempotente: solo toca `nombreCliente = ''`.
 * Agrupa por el valor destino (pocos cientos de nombres) y trocea los ids para
 * no rozar el límite de parámetros de Postgres.
 */
async function backfillNombreCliente(
  filas: { id: string; nombreCliente: string }[],
): Promise<number> {
  const grupos = new Map<string, string[]>();
  for (const f of filas) {
    const clave = f.nombreCliente;
    (grupos.get(clave) ?? grupos.set(clave, []).get(clave)!).push(f.id);
  }

  let actualizadas = 0;
  for (const [nombreCliente, ids] of grupos) {
    for (let i = 0; i < ids.length; i += LOTE) {
      const { count } = await prisma.gestion.updateMany({
        where: { id: { in: ids.slice(i, i + LOTE) }, nombreCliente: '' },
        data: { nombreCliente },
      });
      actualizadas += count;
    }
  }
  return actualizadas;
}

/**
 * Rellena `telefono` en filas demo creadas antes de que los builders lo poblaran
 * (`skipDuplicates` no actualiza). Idempotente: solo toca `telefono = ''`, así que
 * correr el seed dos veces no reasigna números ya puestos. Un `updateMany` por
 * número (troceado) — no hay agrupación posible: cada índice tiene el suyo.
 */
async function backfillTelefono(
  filas: { id: string; telefono: string }[],
): Promise<number> {
  const grupos = new Map<string, string[]>();
  for (const f of filas) {
    const clave = f.telefono;
    (grupos.get(clave) ?? grupos.set(clave, []).get(clave)!).push(f.id);
  }

  let actualizadas = 0;
  for (const [telefono, ids] of grupos) {
    for (let i = 0; i < ids.length; i += LOTE) {
      const { count } = await prisma.gestion.updateMany({
        where: { id: { in: ids.slice(i, i + LOTE) }, telefono: '' },
        data: { telefono },
      });
      actualizadas += count;
    }
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

  // Banco de casos borde de enero 2026: pocas gestiones, muchas formas distintas
  // (día vacío, día de 1 gestión, dona al 100 %, metas incumplidas, 10 operadores…).
  // Usa TODO el pool de operadores, incluidos los dummy, que hasta ahora no tenían
  // ninguna gestión. Enero está fuera de la ventana de `construirGestionesMensuales`
  // (4 meses cerrados + el mes en curso), así que no pisa nada ya sembrado.
  const poolEnero = [
    ...usuarios
      .filter((u) => u.email !== 'operador@fibex.com')
      .map((u) => u.id),
    ...dummies.map((u) => u.id),
  ];
  const enero = construirEneroDemo(poolEnero);
  let nuevasEnero = 0;
  for (let i = 0; i < enero.length; i += LOTE) {
    const { count: nuevas } = await prisma.gestion.createMany({
      data: enero.slice(i, i + LOTE),
      skipDuplicates: true,
    });
    nuevasEnero += nuevas;
  }
  console.log(
    `Seed enero (casos borde) — ${enero.length} gestiones generadas · ${nuevasEnero} nuevas en base`,
  );

  console.log(
    `Seed OK — ${usuarios.length} usuarios · ${dummies.length} operadores dummy · ${count} gestiones nuevas · ${total} gestiones el ${fecha}`,
  );
  console.log(
    `Seed mensual — ${mensuales.length} gestiones generadas · ${nuevasMensuales} nuevas en base`,
  );

  // Backfill de nombreCliente en filas demo anteriores a la columna.
  const nombresRellenados = await backfillNombreCliente([
    ...gestiones,
    ...supervisionGestiones,
    ...mensuales,
    ...enero,
  ]);
  if (nombresRellenados > 0) {
    console.log(
      `Seed registro — ${nombresRellenados} nombreCliente rellenados`,
    );
  }

  // Backfill de telefono en filas demo anteriores a que el seed lo poblara.
  const telefonosRellenados = await backfillTelefono([
    ...gestiones,
    ...supervisionGestiones,
    ...mensuales,
    ...enero,
  ]);
  if (telefonosRellenados > 0) {
    console.log(`Seed registro — ${telefonosRellenados} teléfonos rellenados`);
  }

  // Homologa TODAS las filas demo ya persistidas (incluidas las jornadas de días
  // anteriores, que ningún builder vuelve a generar): abonado Fibex en vez de
  // zona y detalle/solucion/tipo/observacion sin huecos. Convergente.
  const { filas: filasDemo, escrituras } = await backfillDemo([
    ...gestiones,
    ...supervisionGestiones,
    ...mensuales,
    ...enero,
  ]);
  console.log(
    `Seed demo — ${filasDemo} filas homologadas (abonado/detalle/solucion/tipo/observacion) · ${escrituras} escrituras`,
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
