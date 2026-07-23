import { EstadoAtencion } from '../../generated/prisma/enums';

/**
 * Catálogos de Fibex Play · Gestión de Clientes. Fuente ÚNICA de verdad: los
 * DTOs validan (@IsIn) contra estas constantes y el endpoint las expone al front
 * para poblar los selects del formulario. No duplicar en otros módulos.
 */

/** Canales reportables por la App Fibex (10 dummy). */
export const CANALES = [
  'ESPN',
  'Cartoon Network',
  'HBO Max',
  'Discovery',
  'CNN Español',
  'Fox Sports',
  'Nat Geo',
  'TNT',
  'Warner Channel',
  'Universal TV',
] as const;

/** Categorías de origen del problema, en el orden fijo del catálogo (panel donut). */
export const ORIGENES = [
  'Señal / Transmisión',
  'App / Login',
  'Cuenta / Pago',
  'Dispositivo',
] as const;

export type Origen = (typeof ORIGENES)[number];

/**
 * Mapa Motivo → Origen. El `origen` NO se persiste: se deriva del `motivo` con
 * este mapa (único y testeable) para alimentar el panel "Origen del Problema".
 * El orden de las claves define el orden de los motivos en el catálogo.
 */
export const MOTIVO_ORIGEN: Record<string, Origen> = {
  'Sin señal': 'Señal / Transmisión',
  'Video congelado': 'Señal / Transmisión',
  'Audio desfasado': 'Señal / Transmisión',
  'Cortes / buffering': 'Señal / Transmisión',
  'App no carga': 'App / Login',
  'Error de login': 'App / Login',
  'Suscripción vencida': 'Cuenta / Pago',
  'Error de facturación': 'Cuenta / Pago',
  'Dispositivo no compatible': 'Dispositivo',
  'Falla del decodificador': 'Dispositivo',
};

/** Motivos del catálogo (claves de `MOTIVO_ORIGEN`, en orden). */
export const MOTIVOS = Object.keys(MOTIVO_ORIGEN);

/** Soluciones aplicables (6). */
export const SOLUCIONES = [
  'Reinicio de la app',
  'Reset de credenciales',
  'Recarga de guía / EPG',
  'Reinicio de ONU',
  'Verificación de pago',
  'Escalar a NOC',
] as const;

/** Estados de la atención (enum de Prisma), en orden de presentación. */
export const ESTADOS: EstadoAtencion[] = [
  'SOLUCIONADO',
  'EN_PROCESO',
  'ESCALADO',
];

/** Deriva el origen de un motivo; `undefined` si el motivo no está en el catálogo. */
export function origenDeMotivo(motivo: string): Origen | undefined {
  return MOTIVO_ORIGEN[motivo];
}
