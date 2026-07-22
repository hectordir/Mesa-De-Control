import { useCallback, useMemo, useState } from 'react'

const DIAS = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
] as const

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

/**
 * Formateo propio en es-VE: `Intl` depende del ICU del entorno y aquí sólo
 * necesitamos dos patrones fijos y deterministas.
 */
function partes(iso: string) {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return { anio, mes, dia, fecha: new Date(Date.UTC(anio, mes - 1, dia)) }
}

/** `viernes 17 de julio de 2026` */
export function formatoLargo(iso: string): string {
  const { anio, mes, dia, fecha } = partes(iso)
  return `${DIAS[fecha.getUTCDay()]} ${dia} de ${MESES[mes - 1]} de ${anio}`
}

/** `17 jul 2026` */
export function formatoCorto(iso: string): string {
  const { anio, mes, dia } = partes(iso)
  return `${dia} ${MESES[mes - 1].slice(0, 3)} ${anio}`
}

/** Fecha local de hoy en `YYYY-MM-DD` (sin desfase por UTC). */
export function hoyISO(): string {
  const ahora = new Date()
  const mes = `${ahora.getMonth() + 1}`.padStart(2, '0')
  const dia = `${ahora.getDate()}`.padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}

export interface OperationDay {
  fecha: string
  largo: string
  corto: string
  esHoy: boolean
  setFecha: (fecha: string) => void
  volverAHoy: () => void
}

/** Fecha de operación de la vista: hoy por defecto, con "volver a hoy". */
export function useOperationDay(): OperationDay {
  const [fecha, setFecha] = useState(hoyISO)
  const volverAHoy = useCallback(() => setFecha(hoyISO()), [])

  return useMemo(
    () => ({
      fecha,
      largo: formatoLargo(fecha),
      corto: formatoCorto(fecha),
      esHoy: fecha === hoyISO(),
      setFecha,
      volverAHoy,
    }),
    [fecha, volverAHoy],
  )
}
