/**
 * Formateo de instantes en la hora de la operación (Venezuela).
 *
 * El backend envía varios campos como **ISO UTC crudo** (`createdAt`,
 * `detectadoEn`, `hora` del radar de actividad…). Si el front los formatease con
 * `toLocaleTimeString`/`getHours()`, un usuario fuera de Venezuela vería horas y
 * hasta días distintos a los del backend. Todo se formatea aquí con la **zona
 * IANA** explícita.
 *
 * Nunca restar 4 horas fijas: Venezuela estuvo en UTC−04:30 entre 2007 y 2016 y
 * una resta fija falsearía cualquier instante histórico. `Intl` lo resuelve.
 */

import { DIAS, MESES } from './fechas'

export const ZONA_VE = 'America/Caracas'

interface PartesVE {
  anio: number
  mes: number
  dia: number
  hora: number
  minuto: number
}

const FORMATO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_VE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Partes de calendario del instante ya en Caracas; `null` si no es válido. */
function partesVE(instante: string | Date): PartesVE | null {
  const fecha = instante instanceof Date ? instante : new Date(instante)
  if (Number.isNaN(fecha.getTime())) return null

  const partes: Record<string, string> = {}
  for (const { type, value } of FORMATO.formatToParts(fecha)) {
    partes[type] = value
  }
  return {
    anio: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    hora: Number(partes.hour),
    minuto: Number(partes.minute),
  }
}

const dosDigitos = (valor: number) => `${valor}`.padStart(2, '0')

/** `HH:mm` (24 h) del instante en Caracas; `''` si no es un instante válido. */
export function horaVE(instante: string | Date): string {
  const p = partesVE(instante)
  if (!p) return ''
  return `${dosDigitos(p.hora)}:${dosDigitos(p.minuto)}`
}

/** `YYYY-MM-DD` del instante en Caracas; `''` si no es un instante válido. */
export function fechaISOVE(instante: string | Date): string {
  const p = partesVE(instante)
  if (!p) return ''
  return `${p.anio}-${dosDigitos(p.mes)}-${dosDigitos(p.dia)}`
}

/** `miércoles 22 de julio` del instante en Caracas; `''` si no es válido. */
export function fechaLargaVE(instante: string | Date): string {
  const p = partesVE(instante)
  if (!p) return ''
  // `Date.UTC` + `getUTCDay` da el día de la semana del calendario ya resuelto
  // en Caracas, sin volver a mezclar zonas.
  const diaSemana = new Date(Date.UTC(p.anio, p.mes - 1, p.dia)).getUTCDay()
  return `${DIAS[diaSemana]} ${p.dia} de ${MESES[p.mes - 1]}`
}

/** Día de operación en curso (`YYYY-MM-DD`), según la hora de Venezuela. */
export function hoyVE(ahora: Date = new Date()): string {
  return fechaISOVE(ahora)
}

/** Mes de operación en curso (`YYYY-MM`), según la hora de Venezuela. */
export function mesActualVE(ahora: Date = new Date()): string {
  return fechaISOVE(ahora).slice(0, 7)
}
