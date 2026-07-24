import { ResultadoGestion } from '../generated/prisma/enums';

/** Las 10 parroquias de La Guaira del diseño de Admin · Supervisión. */
export const ZONAS_GUAIRA = [
  'Caraballeda',
  'Macuto',
  'La Guaira',
  'Maiquetía',
  'Catia La Mar',
  'Naiguatá',
  'Carayaca',
  'El Junko',
  'La Sabana',
  'Chuspa',
] as const;

const MOTIVOS_SUP = [
  'Corte de fibra (FTTH)',
  'Sin señal / ONT',
  'Lentitud de navegación',
  'Falla en IPTV',
  'WiFi intermitente',
  'Cambio de clave WiFi',
] as const;

/**
 * Volumen de gestiones de HOY por zona (mismo orden que `ZONAS_GUAIRA`).
 * Elegido para que el panel de zonas muestre los cuatro estados por umbral
 * (>=10 danger, >=5 warning, >=3 info, resto success).
 */
const VOLUMEN_HOY = [12, 8, 6, 5, 4, 3, 3, 2, 2, 1];

/** 1 de cada 3 gestiones de hoy se escala (alimenta bandeja/sla con dias=0). */
const RESULTADOS_HOY: ResultadoGestion[] = [
  'SOLUCIONADO_MESA',
  'ENVIADO_SOPORTE2',
  'ESCALADO_NOC',
];

const DIA_MS = 86_400_000;
/** Primera gestión del día: 12:00 UTC = 08:00 en Venezuela. */
const HORA_INICIO = 12;

export interface SupervisionGestion {
  id: string;
  operadorId: string;
  resultado: ResultadoGestion;
  motivo: string;
  ubicacion: string;
  fecha: Date;
  createdAt: Date;
  abonado: string;
}

/**
 * Construye el dataset de Admin · Supervisión: gestiones de HOY en las 10 zonas
 * (para KPIs, zonas y heatmap) más escaladas abiertas de 1–5 días de antigüedad
 * (para Bandeja N2 y SLA). Ids deterministas con la fecha → idempotente con
 * `skipDuplicates`. Sin aleatoriedad: la posición fija todo.
 */
export function construirSupervisionDemo(
  fecha: string,
  operadorIds: readonly string[],
): SupervisionGestion[] {
  const hoy = new Date(`${fecha}T00:00:00.000Z`);
  const ops = operadorIds.length > 0 ? operadorIds : ['demo'];
  const filas: SupervisionGestion[] = [];
  let global = 0;

  const push = (
    dias: number,
    zi: number,
    k: number,
    resultado: ResultadoGestion,
  ) => {
    const zona = ZONAS_GUAIRA[zi];
    const fechaDia = new Date(hoy.getTime() - dias * DIA_MS);
    const createdAt = new Date(
      fechaDia.getTime() + (HORA_INICIO * 60 + k * 7) * 60_000,
    );
    filas.push({
      id: `sup-${fecha}-d${dias}-z${zi}-${String(k).padStart(2, '0')}`,
      operadorId: ops[global % ops.length],
      resultado,
      motivo: MOTIVOS_SUP[global % MOTIVOS_SUP.length],
      ubicacion: zona,
      fecha: fechaDia,
      createdAt,
      abonado: `Abonado ${zona} #${String(k + 1).padStart(2, '0')}`,
    });
    global += 1;
  };

  // Gestiones de HOY: volumen por zona con resultados intercalados.
  ZONAS_GUAIRA.forEach((_, zi) => {
    for (let k = 0; k < VOLUMEN_HOY[zi]; k += 1) {
      push(0, zi, k, RESULTADOS_HOY[k % RESULTADOS_HOY.length]);
    }
  });

  // Escaladas abiertas de 1–5 días: dos por antigüedad, en zonas rotativas,
  // alternando N2/NOC. Pueblan Bandeja N2 y los buckets de SLA (1,2,3,4+).
  for (let dias = 1; dias <= 5; dias += 1) {
    for (let j = 0; j < 2; j += 1) {
      const zi = (dias + j) % ZONAS_GUAIRA.length;
      const resultado: ResultadoGestion =
        j === 0 ? 'ESCALADO_NOC' : 'ENVIADO_SOPORTE2';
      push(dias, zi, j, resultado);
    }
  }

  return filas;
}
