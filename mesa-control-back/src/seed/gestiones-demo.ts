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

/** Nombres de pila del catálogo demo de clientes. */
const NOMBRES = [
  'María',
  'José',
  'Ana',
  'Carlos',
  'Luisa',
  'Pedro',
  'Carmen',
  'Rafael',
  'Yolanda',
  'Miguel',
  'Daniela',
  'Andrés',
  'Rosa',
  'Jesús',
  'Gabriela',
  'Alberto',
  'Patricia',
  'Ramón',
  'Vanessa',
  'Óscar',
] as const;

/** Apellidos del catálogo demo de clientes. */
const APELLIDOS = [
  'Pérez',
  'Rodríguez',
  'González',
  'Hernández',
  'Marcano',
  'Blanco',
  'Sánchez',
  'Rivas',
  'Meléndez',
  'Castillo',
  'Bermúdez',
  'Salazar',
  'Ortega',
  'Guerrero',
  'Zambrano',
  'Aponte',
  'Silva',
] as const;

/**
 * Nombre de cliente plausible y determinista por índice: `NOMBRES` y `APELLIDOS`
 * tienen tamaños coprimos (20 y 17), así que la combinación no se repite hasta
 * las 340 posiciones. Sin aleatoriedad → el seed sigue siendo idempotente.
 */
export function nombreClientePorIndice(i: number): string {
  return `${NOMBRES[i % NOMBRES.length]} ${APELLIDOS[i % APELLIDOS.length]}`;
}

/** Prefijos móviles vigentes en Venezuela. */
const PREFIJOS_TELEFONO = ['0412', '0414', '0416', '0424', '0426'] as const;
/** Coprimo de 10^7: `i · PASO mod 10^7` no repite abonado hasta los 10 M. */
const PASO_TELEFONO = 7_919;

/**
 * Teléfono venezolano `04XX-XXX-XXXX` determinista por índice: el prefijo rota
 * entre los 5 móviles y los 7 dígitos salen de una progresión coprima con 10^7,
 * así que dos índices distintos nunca comparten número. Sin aleatoriedad → el
 * seed sigue siendo idempotente.
 */
export function telefonoPorIndice(i: number): string {
  const prefijo = PREFIJOS_TELEFONO[i % PREFIJOS_TELEFONO.length];
  const digitos = String((i * PASO_TELEFONO + 1_234_567) % 10_000_000).padStart(
    7,
    '0',
  );
  return `${prefijo}-${digitos.slice(0, 3)}-${digitos.slice(3)}`;
}

/** Coprimo de 9·10^6: `i · PASO mod 9·10^6` no repite en 9 M de índices. */
const PASO_ABONADO = 4_871;

/**
 * Identificador del abonado en Fibex: numérico de 7 dígitos, determinista por
 * índice y sin repetir. El rango arranca en 1 000 000 para que siempre tenga
 * exactamente 7 dígitos. NO es la zona (que vive en `ubicacion`) ni el id de BD.
 */
export function abonadoPorIndice(i: number): string {
  return String(1_000_000 + ((i * PASO_ABONADO) % 9_000_000));
}

/**
 * Catálogos de `detalle`/`solucion`/`tipo`: copia EXACTA de
 * `mesa-control-front/src/features/registro/opciones.ts`
 * (`DETALLE_OPCIONES`, `SOLUCION_OPCIONES`, `TIPO_OPCIONES`). Los selects del
 * front son cerrados: un valor fuera de catálogo sale en blanco al editar.
 * `gestiones-demo.spec.ts` lee ese archivo y falla si ambos divergen.
 */
export const DETALLES: readonly string[] = [
  'Falla LOS',
  'Internet Lento',
  'Sin Internet',
  'Caídas Seguidas',
  'No Navega',
  'Usuario Clave GNT',
];

export const SOLUCIONES: readonly string[] = [
  'Reinicio de ONU',
  'Cambio de potencia',
  'Reconfiguración remota',
  'Recableado interno',
  'Reemplazo de equipo',
];

export const TIPOS: readonly string[] = [
  'Mesa',
  'Soporte 2',
  'NOC',
  'Visita técnica',
];

/** Notas de cierre plausibles; 11 (primo) para variar frente a 6/5/4. */
export const OBSERVACIONES: readonly string[] = [
  'Cliente notificado; se agenda seguimiento.',
  'Se verifica señal en sitio, potencia dentro de rango.',
  'Cliente reporta intermitencia desde la madrugada.',
  'Se reinicia el equipo y navega con normalidad.',
  'Queda pendiente confirmación del cliente.',
  'Se escala al NOC por falla en el nodo.',
  'Sin respuesta del abonado; se reintenta más tarde.',
  'Se orienta al cliente en la configuración del WiFi.',
  'Corte de fibra en el tramo; cuadrilla en camino.',
  'Se reprograma la visita técnica a solicitud del cliente.',
  'Atención cerrada en primera llamada.',
];

/** Datos de atención de una gestión demo (los que el modal edita con selects). */
export interface AtencionDemo {
  detalle: string;
  solucion: string;
  tipo: string;
  observacion: string;
}

/**
 * `detalle`/`solucion`/`tipo`/`observacion` deterministas por índice. Los cuatro
 * catálogos tienen tamaños 6/5/4/11, así que la combinación completa tarda en
 * repetirse y cada uno recorre todos sus valores. Sin aleatoriedad → idempotente.
 */
export function atencionPorIndice(i: number): AtencionDemo {
  return {
    detalle: DETALLES[i % DETALLES.length],
    solucion: SOLUCIONES[i % SOLUCIONES.length],
    tipo: TIPOS[i % TIPOS.length],
    observacion: OBSERVACIONES[i % OBSERVACIONES.length],
  };
}

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
  /** Identificador Fibex del abonado (7 dígitos). Determinista por índice. */
  abonado: string;
  /** Detalle de la orden (catálogo del front). Determinista por índice. */
  detalle: string;
  /** Solución aplicada (catálogo del front). Determinista por índice. */
  solucion: string;
  /** Tipo de resolución (catálogo del front). Determinista por índice. */
  tipo: string;
  /** Nota de cierre. Determinista por índice. */
  observacion: string;
  /** Nombre del cliente (Registro). Determinista por índice. */
  nombreCliente: string;
  /** Teléfono de contacto `04XX-XXX-XXXX`. Determinista por índice. */
  telefono: string;
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
      // Identificador Fibex del abonado; la zona ya viaja en `ubicacion`.
      abonado: abonadoPorIndice(i),
      nombreCliente: nombreClientePorIndice(i),
      telefono: telefonoPorIndice(i),
      ...atencionPorIndice(i),
      fecha: fechaDia,
      createdAt: new Date(inicio + i * CADENCIA_MS),
      ...canalDuracionPorIndice(i),
    };
  });
}
