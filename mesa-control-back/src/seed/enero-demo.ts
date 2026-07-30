import {
  abonadoPorIndice,
  atencionPorIndice,
  canalDuracionPorIndice,
  entrelazar,
  GestionDemo,
  MOTIVOS,
  nombreClientePorIndice,
  RESULTADOS,
  telefonoPorIndice,
} from './gestiones-demo';
import { MOTIVOS_HEATMAP, ZONAS } from './gestiones-mensuales';

/**
 * Banco de casos borde de enero de 2026.
 *
 * A diferencia del resto del seed (que busca volumen realista), este módulo
 * busca **variedad**: pocos registros al mes, deliberadamente repartidos para
 * que al pasear la UI por enero se vea cada caso límite —día vacío, día de una
 * sola gestión, dona al 100 %, metas incumplidas, tabla de operadores con
 * scroll, Top 5 de averías corto y recortado…—.
 *
 * Todo sale del plan declarativo `PLAN_ENERO`: sin `Math.random()` ni fechas
 * implícitas. Los ids incluyen la fecha y la posición, así que el seed es
 * idempotente con `createMany({ skipDuplicates: true })`.
 */

/** Mes que ocupa este banco de pruebas. Todos los casos caben aquí. */
export const PERIODO_ENERO = '2026-01';

/** Catálogo de motivos del mes: los 6 del heatmap mensual + la cola del diario. */
export const MOTIVOS_ENERO: readonly string[] = [
  ...MOTIVOS_HEATMAP,
  ...MOTIVOS.map(([motivo]) => motivo),
];

/** Primera gestión del día: 12:00 UTC = 08:00 en Venezuela (igual que el resto del seed). */
const INICIO_JORNADA_UTC_MS = 12 * 3_600_000;
/** Ventana horaria sobre la que se reparten las gestiones de un día. */
const JORNADA_MS = 9 * 3_600_000;

/** Carga de un operador en un día: gestiones por resultado, en orden `RESULTADOS`. */
export interface CargaOperador {
  /** Índice en el pool de operadores (se toma módulo su longitud). */
  op: number;
  reparto: readonly number[];
}

/** Un día del plan: qué caso ilustra y con qué forma exacta de datos. */
export interface DiaEnero {
  /** `YYYY-MM-DD` */
  fecha: string;
  /** Etiqueta estable del caso borde (la usan los tests y el resumen). */
  caso: string;
  /** Qué se debe poder ver en la UI ese día. */
  descripcion: string;
  operadores: readonly CargaOperador[];
  /** Cuántos motivos distintos aparecen ese día. */
  motivos: number;
  /** Cuántas zonas distintas aparecen ese día. */
  zonas: number;
}

/**
 * Reparte un total por resultado entre `ops` operadores consecutivos desde
 * `desde`, de forma determinista (los primeros absorben el resto de la división).
 */
function repartir(
  reparto: readonly number[],
  ops: number,
  desde: number,
): CargaOperador[] {
  return Array.from({ length: ops }, (_, j) => ({
    op: desde + j,
    reparto: reparto.map(
      (total) => Math.floor(total / ops) + (j < total % ops ? 1 : 0),
    ),
  }));
}

/** Azúcar para declarar un día "uniforme" (mismo reparto repartido entre N operadores). */
function dia(
  fecha: string,
  caso: string,
  descripcion: string,
  opciones: {
    reparto?: readonly number[];
    ops?: number;
    desde?: number;
    motivos?: number;
    zonas?: number;
    operadores?: readonly CargaOperador[];
  },
): DiaEnero {
  const {
    reparto = [0, 0, 0, 0, 0],
    ops = 1,
    desde = 0,
    motivos = 1,
    zonas = 1,
    operadores,
  } = opciones;
  return {
    fecha,
    caso,
    descripcion,
    operadores: operadores ?? repartir(reparto, ops, desde),
    motivos,
    zonas,
  };
}

const d = (n: number) => `${PERIODO_ENERO}-${String(n).padStart(2, '0')}`;

/**
 * El calendario completo de enero: 31 días, cada uno con su caso. Los repartos
 * van en el orden SOLUCIONADO_MESA / ENVIADO_SOPORTE2 / ESCALADO_NOC /
 * PENDIENTE_CLIENTE / REAGENDADO. Las metas de la UI son efectividad ≥ 75 %,
 * escalados a NOC ≤ 25 y pendiente cliente ≤ 40.
 */
export const PLAN_ENERO: readonly DiaEnero[] = [
  dia(d(1), 'una-gestion', 'Primer día del mes con UNA sola gestión', {
    reparto: [1, 0, 0, 0, 0],
    ops: 1,
    desde: 0,
    motivos: 1,
    zonas: 1,
  }),
  dia(
    d(2),
    'pocas-gestiones',
    '3 gestiones: reproduce el defecto visual del 25 jul',
    {
      reparto: [1, 1, 0, 1, 0],
      ops: 2,
      desde: 1,
      motivos: 2,
      zonas: 2,
    },
  ),
  dia(
    d(3),
    'dia-vacio',
    'Sábado SIN ninguna gestión: estado vacío del Monitor Diario',
    {},
  ),
  dia(d(4), 'finde-bajo', 'Domingo con actividad mínima (2 gestiones)', {
    reparto: [1, 0, 0, 1, 0],
    ops: 1,
    desde: 3,
    motivos: 2,
    zonas: 2,
  }),
  dia(
    d(5),
    'un-operador',
    'Jornada atendida por UN solo operador (12 gestiones)',
    {
      reparto: [8, 2, 1, 1, 0],
      ops: 1,
      desde: 1,
      motivos: 4,
      zonas: 3,
    },
  ),
  dia(d(6), 'cinco-resultados', 'Los CINCO resultados presentes en la dona', {
    reparto: [3, 2, 2, 2, 1],
    ops: 2,
    desde: 2,
    motivos: 5,
    zonas: 4,
  }),
  dia(
    d(7),
    'resultado-unico',
    'Un ÚNICO resultado: dona al 100 % y efectividad 100 % (sobre meta)',
    {
      reparto: [9, 0, 0, 0, 0],
      ops: 2,
      desde: 0,
      motivos: 3,
      zonas: 3,
    },
  ),
  dia(
    d(8),
    'efectividad-baja',
    'Efectividad 25 %, muy por debajo de la meta del 75 %',
    {
      reparto: [5, 6, 4, 3, 2],
      ops: 3,
      desde: 1,
      motivos: 5,
      zonas: 5,
    },
  ),
  dia(
    d(9),
    'muchos-operadores',
    '10 operadores distintos: scroll en Resumen por operador',
    {
      reparto: [10, 4, 3, 2, 1],
      ops: 10,
      desde: 0,
      motivos: 6,
      zonas: 8,
    },
  ),
  dia(
    d(10),
    'finde-una-gestion',
    'Sábado con una única gestión escalada a N2',
    {
      reparto: [0, 1, 0, 0, 0],
      ops: 1,
      desde: 5,
      motivos: 1,
      zonas: 1,
    },
  ),
  dia(d(11), 'finde-vacio-2', 'Domingo sin actividad', {}),
  dia(
    d(12),
    'efectividad-dispar',
    'Un operador al 100 % de efectividad y otro al 0 %',
    {
      operadores: [
        { op: 2, reparto: [10, 0, 0, 0, 0] },
        { op: 7, reparto: [0, 3, 3, 2, 2] },
      ],
      motivos: 5,
      zonas: 4,
    },
  ),
  dia(
    d(13),
    'pocos-motivos',
    'Sólo 3 motivos distintos: Top 5 Averías con lista corta',
    {
      reparto: [6, 2, 2, 1, 1],
      ops: 3,
      desde: 4,
      motivos: 3,
      zonas: 3,
    },
  ),
  dia(
    d(14),
    'muchos-motivos',
    '9 motivos distintos: el Top 5 Averías recorta',
    {
      reparto: [8, 4, 3, 2, 1],
      ops: 4,
      desde: 0,
      motivos: 9,
      zonas: 6,
    },
  ),
  dia(
    d(15),
    'volumen-alto',
    '130 gestiones y 10 operadores: scroll en la tabla y en el Radar',
    {
      reparto: [70, 25, 15, 12, 8],
      ops: 10,
      desde: 0,
      motivos: 12,
      zonas: 16,
    },
  ),
  dia(d(16), 'noc-sobre-meta', '30 escalados a NOC: supera la meta de ≤ 25', {
    reparto: [10, 5, 30, 3, 2],
    ops: 4,
    desde: 2,
    motivos: 6,
    zonas: 7,
  }),
  dia(d(17), 'finde-vacio-3', 'Sábado sin actividad', {}),
  dia(d(18), 'finde-vacio-4', 'Domingo sin actividad', {}),
  dia(
    d(19),
    'metas-en-verde',
    'Las tres metas cumplidas: 75 % efectividad, 5 NOC, 3 pendientes',
    {
      reparto: [30, 2, 5, 3, 0],
      ops: 4,
      desde: 0,
      motivos: 5,
      zonas: 6,
    },
  ),
  dia(
    d(20),
    'pendiente-sobre-meta',
    '45 en Pendiente Cliente: supera la meta de ≤ 40',
    {
      reparto: [12, 4, 3, 45, 2],
      ops: 5,
      desde: 1,
      motivos: 7,
      zonas: 8,
    },
  ),
  dia(d(21), 'volumen-bajo-laborable', 'Día laborable con sólo 2 gestiones', {
    reparto: [1, 0, 1, 0, 0],
    ops: 2,
    desde: 6,
    motivos: 2,
    zonas: 2,
  }),
  dia(d(22), 'jornada-corta', 'Jornada corta (15 gestiones, 3 operadores)', {
    reparto: [8, 3, 2, 1, 1],
    ops: 3,
    desde: 3,
    motivos: 5,
    zonas: 5,
  }),
  dia(d(23), 'jornada-media', 'Jornada media (28 gestiones, 5 operadores)', {
    reparto: [16, 5, 3, 3, 1],
    ops: 5,
    desde: 0,
    motivos: 7,
    zonas: 7,
  }),
  dia(
    d(24),
    'finde-una-gestion-2',
    'Sábado con una única gestión escalada al NOC',
    {
      reparto: [0, 0, 1, 0, 0],
      ops: 1,
      desde: 8,
      motivos: 1,
      zonas: 1,
    },
  ),
  dia(d(25), 'finde-vacio-5', 'Domingo sin actividad', {}),
  dia(d(26), 'jornada-alta', 'Jornada alta (35 gestiones, 6 operadores)', {
    reparto: [20, 6, 4, 3, 2],
    ops: 6,
    desde: 2,
    motivos: 8,
    zonas: 9,
  }),
  dia(d(27), 'jornada-media-2', 'Jornada media (22 gestiones, 4 operadores)', {
    reparto: [12, 4, 3, 2, 1],
    ops: 4,
    desde: 5,
    motivos: 6,
    zonas: 6,
  }),
  dia(d(28), 'jornada-baja', 'Jornada baja (9 gestiones, 3 operadores)', {
    reparto: [4, 2, 1, 1, 1],
    ops: 3,
    desde: 7,
    motivos: 4,
    zonas: 4,
  }),
  dia(d(29), 'jornada-alta-2', 'Jornada alta (30 gestiones, 5 operadores)', {
    reparto: [18, 5, 3, 3, 1],
    ops: 5,
    desde: 1,
    motivos: 7,
    zonas: 8,
  }),
  dia(d(30), 'jornada-media-3', 'Jornada media (18 gestiones, 4 operadores)', {
    reparto: [9, 4, 2, 2, 1],
    ops: 4,
    desde: 4,
    motivos: 6,
    zonas: 6,
  }),
  dia(
    d(31),
    'ultimo-dia-del-mes',
    'Último día del mes con actividad ligera (6 gestiones)',
    {
      reparto: [3, 1, 1, 1, 0],
      ops: 2,
      desde: 8,
      motivos: 3,
      zonas: 3,
    },
  ),
];

/** Ventana cíclica de `largo` elementos del catálogo, empezando en `desde`. */
function ventana<T>(catalogo: readonly T[], desde: number, largo: number): T[] {
  return Array.from(
    { length: Math.max(largo, 1) },
    (_, i) => catalogo[(desde + i) % catalogo.length],
  );
}

/** Gestiones de un único día del plan. */
function construirDia(
  plan: DiaEnero,
  indice: number,
  operadorIds: readonly string[],
): GestionDemo[] {
  // Dentro de cada operador se entrelazan sus resultados, y luego se entrelazan
  // los operadores: así ninguna ventana del día (ni el Radar, que mira las
  // últimas) queda copada por un solo operador o resultado.
  const porOperador = plan.operadores
    .filter(({ reparto }) => reparto.some((n) => n > 0))
    .map(({ op, reparto }) =>
      entrelazar(
        reparto.map((veces, r) =>
          Array.from({ length: veces }, () => ({
            operadorId: operadorIds[op % operadorIds.length],
            resultado: RESULTADOS[r],
          })),
        ),
      ),
    );

  const secuencia = entrelazar(porOperador);
  if (secuencia.length === 0) return [];

  // Motivos y zonas: ventanas rotativas del catálogo, distintas cada día, para
  // que el heatmap y el mapa del mes no salgan planos ni siempre iguales.
  const motivos = ventana(MOTIVOS_ENERO, indice * 3, plan.motivos);
  const zonas = ventana(ZONAS, indice * 5, plan.zonas);

  const medianoche = new Date(`${plan.fecha}T00:00:00.000Z`);
  const inicio = medianoche.getTime() + INICIO_JORNADA_UTC_MS;
  const paso = Math.floor(JORNADA_MS / secuencia.length);

  return secuencia.map((g, i) => {
    const ubicacion = zonas[i % zonas.length];
    return {
      id: `enero-${plan.fecha}-${String(i).padStart(3, '0')}`,
      operadorId: g.operadorId,
      resultado: g.resultado,
      motivo: motivos[i % motivos.length],
      ubicacion,
      abonado: abonadoPorIndice(i),
      nombreCliente: nombreClientePorIndice(i),
      telefono: telefonoPorIndice(i),
      ...atencionPorIndice(i),
      fecha: medianoche,
      createdAt: new Date(inicio + i * paso),
      ...canalDuracionPorIndice(i),
    };
  });
}

/**
 * Construye el mes completo. `operadorIds` es el pool de operadores disponible
 * (en `prisma/seed.ts`: los 5 del seed histórico más los 5 dummy, que hasta
 * ahora no tenían ninguna gestión); el plan los referencia por posición.
 */
export function construirEneroDemo(
  operadorIds: readonly string[],
): GestionDemo[] {
  if (operadorIds.length === 0) return [];
  return PLAN_ENERO.flatMap((plan, i) => construirDia(plan, i, operadorIds));
}
