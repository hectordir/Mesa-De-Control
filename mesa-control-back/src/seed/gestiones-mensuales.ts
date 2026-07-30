import { ResultadoGestion } from '../generated/prisma/enums';
import {
  abonadoPorIndice,
  atencionPorIndice,
  CANALES,
  entrelazar,
  GestionDemo,
  MOTIVOS,
  nombreClientePorIndice,
  telefonoPorIndice,
} from './gestiones-demo';
import { diaLocal } from './dia';

/** Las 21 zonas del heatmap del diseño (`AnalisisMensual.dc.html`, array `zones`). */
export const ZONAS: readonly string[] = [
  'Canaima',
  'Caraballeda',
  'Carayaca',
  'Caribe',
  'Catia La Mar',
  'Corapal',
  'El Trébol',
  'La Guaira',
  'La Soublette',
  'Las Tunitas',
  'Macuto',
  'Maiquetía',
  'Mare Abajo',
  'Mirabal',
  'Montesano',
  'OLT',
  'Pariata',
  'Simetaca',
  'Tanaguarena',
  'Tunitas',
  'Zamora',
];

/** Las 6 columnas del heatmap del diseño: dominan el volumen del mes. */
export const MOTIVOS_HEATMAP: readonly string[] = [
  'Falla LOS',
  'Internet Lento',
  'Sin Internet',
  'Usuario Clave GNT',
  'Caídas Seguidas',
  'No Navega',
];

/** Cola de motivos: los del monitor diario, con mucho menos peso. */
const MOTIVOS_COLA: readonly string[] = MOTIVOS.map(([motivo]) => motivo);

/** Peso relativo de cada motivo: los 6 del heatmap siempre por delante. */
const PESO_HEATMAP = 8;
const PESO_COLA = 1;

/**
 * Reparto de los resultados distintos de SOLUCIONADO_MESA, en el orden
 * ENVIADO_SOPORTE2 / ESCALADO_NOC / PENDIENTE_CLIENTE / REAGENDADO.
 * Suma 1: se aplica sobre el resto tras apartar los resueltos por la mesa.
 */
const RESTO: readonly (readonly [ResultadoGestion, number])[] = [
  ['ENVIADO_SOPORTE2', 0.4],
  ['ESCALADO_NOC', 0.19],
  ['PENDIENTE_CLIENTE', 0.26],
  ['REAGENDADO', 0.15],
];

/** Volúmenes de los 4 meses cerrados, del más antiguo al más reciente. */
const VOLUMEN_CERRADO = [1240, 1565, 1310, 1685];
/**
 * Efectividad (`SOLUCIONADO_MESA / total`) de esos mismos meses.
 * La meta del equipo es 65 %: la serie cruza esa línea a propósito (dos meses
 * flojos, luego dos por encima) para que el KPI de efectividad muestre sus dos
 * estados —bajo meta y meta superada— al pasear por los periodos de la demo.
 */
const EFECTIVIDAD_CERRADO = [0.41, 0.46, 0.7, 0.68];
/** El mes en curso va a medio camino: volumen parcial y efectividad media. */
const VOLUMEN_EN_CURSO = 455;
const EFECTIVIDAD_EN_CURSO = 0.43;

/** Primera gestión del día: 12:00 UTC = 08:00 en Venezuela. */
const INICIO_JORNADA_UTC_MS = 12 * 3_600_000;
/** Ventana horaria en la que se reparten las gestiones de un día. */
const JORNADA_MS = 9 * 3_600_000;

/** Un mes a sembrar: cuánto, con qué efectividad y hasta qué día. */
export interface MesDemo {
  /** YYYY-MM */
  periodo: string;
  volumen: number;
  /** 0–1 */
  efectividad: number;
  /** Último día del mes que se siembra (inclusive). */
  diaMaximo: number;
}

/** PRNG mulberry32: determinista y sin dependencias. Nunca `Math.random()`. */
function prng(semilla: number): () => number {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Semilla estable derivada del periodo: cada mes tiene su propia forma. */
function semillaDe(periodo: string): number {
  let h = 0x811c9dc5;
  for (const char of periodo) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const dosDigitos = (n: number) => String(n).padStart(2, '0');

/** Días que tiene el mes `YYYY-MM`. */
function diasDelMes(periodo: string): number {
  const [anio, mes] = periodo.split('-').map(Number);
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate();
}

/** Desplaza `periodo` (`YYYY-MM`) en `delta` meses. */
export function desplazarPeriodo(periodo: string, delta: number): string {
  const [anio, mes] = periodo.split('-').map(Number);
  const d = new Date(Date.UTC(anio, mes - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${dosDigitos(d.getUTCMonth() + 1)}`;
}

/**
 * Los 4 meses cerrados anteriores más el mes en curso, relativos a `hoy`
 * (nunca fechas fijas). El mes en curso se corta en el día anterior a hoy:
 * el día de hoy es territorio exclusivo del seed diario del Monitor Diario.
 */
export function mesesAnalisis(hoy: Date): MesDemo[] {
  // Día calendario venezolano: la misma convención que `diaLocal` y los dashboards.
  const [anio, mes, dia] = diaLocal(hoy).split('-');
  const actual = `${anio}-${mes}`;

  const cerrados = VOLUMEN_CERRADO.map((volumen, i) => {
    const periodo = desplazarPeriodo(actual, i - VOLUMEN_CERRADO.length);
    return {
      periodo,
      volumen,
      efectividad: EFECTIVIDAD_CERRADO[i],
      diaMaximo: diasDelMes(periodo),
    };
  });

  const diaMaximo = Number(dia) - 1;
  return [
    ...cerrados,
    {
      periodo: actual,
      // El día 1 no hay mes en curso que sembrar sin pisar al seed diario.
      volumen: diaMaximo < 1 ? 0 : VOLUMEN_EN_CURSO,
      efectividad: EFECTIVIDAD_EN_CURSO,
      diaMaximo: Math.max(diaMaximo, 1),
    },
  ];
}

/** Elige un índice según pesos acumulados. `r` viene del PRNG en [0, 1). */
function elegirPonderado(pesos: readonly number[], r: number): number {
  const total = pesos.reduce((a, b) => a + b, 0);
  let acumulado = r * total;
  for (let i = 0; i < pesos.length; i += 1) {
    acumulado -= pesos[i];
    if (acumulado < 0) return i;
  }
  return pesos.length - 1;
}

/**
 * Máscara zona × motivo del heatmap: cada zona solo "sufre" algunos motivos,
 * así el mapa de calor tiene celdas en 0 y una rampa de color visible.
 * Cada zona conserva al menos un motivo para no desaparecer del mapa.
 */
function construirAfinidades(rnd: () => number): boolean[][] {
  return ZONAS.map(() => {
    const fila = MOTIVOS_HEATMAP.map(() => rnd() < 0.6);
    if (!fila.some(Boolean))
      fila[
        elegirPonderado(
          fila.map(() => 1),
          rnd(),
        )
      ] = true;
    return fila;
  });
}

/** Secuencia de resultados del mes, entrelazada para que no salgan por bloques. */
function resultadosDelMes(
  volumen: number,
  efectividad: number,
): ResultadoGestion[] {
  const mesa = Math.round(volumen * efectividad);
  const resto = volumen - mesa;

  const grupos = RESTO.map(([resultado, cuota], i) => {
    // El último absorbe el redondeo para que la suma cuadre exacta.
    const n =
      i === RESTO.length - 1
        ? resto -
          RESTO.slice(0, -1).reduce((a, [, c]) => a + Math.round(resto * c), 0)
        : Math.round(resto * cuota);
    return Array.from({ length: Math.max(n, 0) }, () => resultado);
  });

  return entrelazar([
    Array.from<ResultadoGestion>({ length: mesa }).fill('SOLUCIONADO_MESA'),
    ...grupos,
  ]);
}

/**
 * Genera las gestiones de un mes. Todo sale de un PRNG sembrado con el
 * periodo: la misma entrada produce siempre la misma salida (idempotencia del
 * seed, que se apoya en ids deterministas + `skipDuplicates`).
 */
export function construirMesDemo(
  mes: MesDemo,
  operadorIds: readonly string[],
): GestionDemo[] {
  if (mes.volumen <= 0 || operadorIds.length === 0) return [];

  const rnd = prng(semillaDe(mes.periodo));

  // Unas pocas zonas concentran incidencias; el resto queda en la parte baja.
  const pesoZona = ZONAS.map(() => 1 + Math.floor(rnd() * 4));
  for (let i = 0; i < 3; i += 1) {
    pesoZona[Math.floor(rnd() * ZONAS.length)] *= 6;
  }
  const afinidad = construirAfinidades(rnd);

  // Reparto por operador con relieve. Va en un PRNG propio (también sembrado
  // por el periodo) para no alterar la secuencia de motivo/zona/fecha: los
  // KPIs, la serie y el heatmap quedan idénticos a la Revisión 1.
  const rndOp = prng(semillaDe(mes.periodo) ^ 0x9e3779b9);
  // Peso de volumen distinto por operador: unos pocos concentran más gestiones.
  const pesoVolumen = operadorIds.map(() => 1 + rndOp() * 4);
  // Fuerza de resolución: sesga a quién se atribuyen los SOLUCIONADO_MESA sin
  // cambiar su total. Operadores "fuertes" reciben más resueltos y menos resto,
  // así la eficiencia por operador varía de forma visible.
  const fuerza = operadorIds.map(() => 0.5 + rndOp() * 1.5);

  const motivos = [...MOTIVOS_HEATMAP, ...MOTIVOS_COLA];
  const pesoMotivo = motivos.map((_, i) =>
    i < MOTIVOS_HEATMAP.length ? PESO_HEATMAP : PESO_COLA,
  );

  const resultados = resultadosDelMes(mes.volumen, mes.efectividad);

  // Canal y duración salen de un PRNG propio (sembrado por el periodo) para no
  // desplazar la secuencia de `rnd`/`rndOp`: zona, motivo, operador y la
  // efectividad quedan idénticos a antes de añadir estos campos.
  const rndCanal = prng(semillaDe(mes.periodo) ^ 0x85ebca6b);

  return resultados.map((resultado, i) => {
    const m = elegirPonderado(pesoMotivo, rnd());
    const motivo = motivos[m];

    // Para los motivos del heatmap solo valen las zonas afines: eso deja celdas en 0.
    const pesos =
      m < MOTIVOS_HEATMAP.length
        ? pesoZona.map((peso, z) => (afinidad[z][m] ? peso : 0))
        : pesoZona;
    const ubicacion = ZONAS[elegirPonderado(pesos, rnd())];

    const dia = 1 + Math.floor(rnd() * mes.diaMaximo);
    const fecha = new Date(`${mes.periodo}-${dosDigitos(dia)}T00:00:00.000Z`);
    const createdAt = new Date(
      fecha.getTime() + INICIO_JORNADA_UTC_MS + Math.floor(rnd() * JORNADA_MS),
    );

    // Los resueltos se sesgan hacia los operadores fuertes; el resto, al revés.
    const esResuelto = resultado === 'SOLUCIONADO_MESA';
    const pesosOperador = operadorIds.map((_, o) =>
      esResuelto ? pesoVolumen[o] * fuerza[o] : pesoVolumen[o] / fuerza[o],
    );
    const operadorId = operadorIds[elegirPonderado(pesosOperador, rndOp())];

    const canal = CANALES[Math.floor(rndCanal() * CANALES.length)];
    // Duración plausible: 2–30 minutos.
    const duracion = 2 + Math.floor(rndCanal() * 29);

    return {
      id: `mensual-${mes.periodo}-${String(i).padStart(4, '0')}`,
      operadorId,
      resultado,
      motivo,
      ubicacion,
      // Identificador Fibex del abonado; la zona ya viaja en `ubicacion`.
      abonado: abonadoPorIndice(i),
      nombreCliente: nombreClientePorIndice(i),
      telefono: telefonoPorIndice(i),
      ...atencionPorIndice(i),
      fecha,
      createdAt,
      canal,
      duracion,
    };
  });
}

/** Los 5 meses de historia demo (4 cerrados + el mes en curso parcial). */
export function construirGestionesMensuales(
  hoy: Date,
  operadorIds: readonly string[],
): GestionDemo[] {
  return mesesAnalisis(hoy).flatMap((mes) =>
    construirMesDemo(mes, operadorIds),
  );
}
