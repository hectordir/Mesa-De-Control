import { CanalGestion, ResultadoGestion } from '../generated/prisma/enums';

/** Canales del Historial, en orden estable para el reparto determinista. */
export const CANALES: readonly CanalGestion[] = [
  'LLAMADA',
  'WHATSAPP',
  'TELEGRAM',
];

/** Orden de las columnas de `reparto`. */
export const RESULTADOS: ResultadoGestion[] = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
  'PENDIENTE_CLIENTE',
  'REAGENDADO',
];

/** Motivos de avería: los 5 del diseño arriba, más cola hasta llegar a 342. */
export const MOTIVOS: readonly (readonly [string, number])[] = [
  ['Corte de fibra (FTTH)', 84],
  ['Sin señal / ONT', 61],
  ['Lentitud de navegación', 47],
  ['Falla en IPTV', 33],
  ['WiFi intermitente', 28],
  ['Cambio de clave WiFi', 27],
  ['Reubicación de equipo', 22],
  ['Facturación / suspensión', 18],
  ['Ruido en línea telefónica', 12],
  ['Solicitud de mudanza', 10],
];

export const UBICACIONES = [
  'Cond. Los Robles',
  'Torre Aurora',
  'Res. El Mirador',
  'Plaza Central',
  'Barrio San Luis',
  'Av. Bolívar Norte',
  'Urb. La Granja',
];

/** Primera gestión del día: 12:00 UTC = 08:00 en Venezuela. */
const INICIO_JORNADA_UTC = 'T12:00:00.000Z';
/** Separación entre gestiones: 342 · 95 s ≈ 9 h de jornada. */
const CADENCIA_MS = 95_000;

export interface OperadorDemo {
  id: string;
  /** Gestiones por resultado, en el orden de `RESULTADOS`. */
  reparto: readonly number[];
}

export interface GestionDemo {
  id: string;
  operadorId: string;
  resultado: ResultadoGestion;
  motivo: string;
  ubicacion: string;
  fecha: Date;
  createdAt: Date;
  /** Canal de la gestión (Historial). Determinista por índice. */
  canal: CanalGestion;
  /** Duración en minutos (2–30), determinista por índice. */
  duracion: number;
  /** Abonado (subscriptor) legible para la lista de Depuración. Determinista. */
  abonado: string;
}

/**
 * Canal y duración deterministas a partir del índice de la gestión. Sin
 * aleatoriedad: la misma posición produce siempre lo mismo (idempotencia).
 * La duración recorre 2–30 min con un paso primo para no repetir en bloque.
 */
export function canalDuracionPorIndice(i: number): {
  canal: CanalGestion;
  duracion: number;
} {
  return {
    canal: CANALES[i % CANALES.length],
    duracion: 2 + ((i * 7) % 29),
  };
}

/**
 * Entrelaza varios grupos repartiendo cada uno de forma uniforme sobre el
 * resultado final: un grupo de `n` elementos ocupa las posiciones
 * `(j + 0.5) / n`, así que todos los grupos están representados en cualquier
 * ventana del recorrido — incluidas las últimas posiciones, que son las que
 * alimentan el "Radar de Operaciones". Determinista: el desempate es el índice
 * del grupo, nunca un aleatorio.
 */
export function entrelazar<T>(grupos: readonly T[][]): T[] {
  return grupos
    .flatMap((items, grupo) =>
      items.map((item, j) => ({
        item,
        grupo,
        clave: (j + 0.5) / items.length,
      })),
    )
    .sort((a, b) => a.clave - b.clave || a.grupo - b.grupo)
    .map(({ item }) => item);
}

/**
 * Construye la jornada demo: 342 gestiones con los totales del diseño,
 * intercaladas entre operadores, resultados y motivos a lo largo del día.
 * Los ids son deterministas (incluyen la fecha) para que el seed sea idempotente.
 */
export function construirGestionesDemo(
  fecha: string,
  operadores: readonly OperadorDemo[],
): GestionDemo[] {
  const fechaDia = new Date(`${fecha}T00:00:00.000Z`);

  // Dentro de cada operador, sus resultados también se entrelazan: si no, sus
  // últimas gestiones del día serían todas del mismo resultado.
  const porOperador = operadores
    .filter(({ reparto }) => reparto.some((n) => n > 0))
    .map(({ id, reparto }) =>
      entrelazar(
        reparto.map((veces, r) =>
          Array.from({ length: veces }, () => ({
            operadorId: id,
            resultado: RESULTADOS[r],
          })),
        ),
      ),
    );

  const secuencia = entrelazar(porOperador);

  const motivos = entrelazar(
    MOTIVOS.map(([motivo, veces]) =>
      Array.from({ length: veces }, () => motivo),
    ),
  );

  const inicio = new Date(`${fecha}${INICIO_JORNADA_UTC}`).getTime();

  return secuencia.map((g, i) => {
    const ubicacion = UBICACIONES[i % UBICACIONES.length];
    return {
      id: `seed-${fecha}-${String(i).padStart(4, '0')}`,
      operadorId: g.operadorId,
      resultado: g.resultado,
      motivo: motivos[i],
      ubicacion,
      // Abonado legible y determinista (número de casa/apto estable por índice).
      abonado: `${ubicacion} · Casa ${String((i % 60) + 1).padStart(2, '0')}`,
      fecha: fechaDia,
      createdAt: new Date(inicio + i * CADENCIA_MS),
      ...canalDuracionPorIndice(i),
    };
  });
}
