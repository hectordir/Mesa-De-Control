import { useCallback, useMemo } from 'react'
import { DIAS, MESES } from '../../../lib/fechas'
import { hoyVE } from '../../../lib/tiempoVE'
import { useDashboardDateStore } from '../../../stores/dashboardDate.store'

/** Meses en es-VE, en minúscula; los reutiliza el filtro mensual. */
export { MESES }

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

/**
 * Día de operación de hoy en `YYYY-MM-DD`, siempre en la hora de Venezuela:
 * la mesa (y el backend) trabajan sobre ese día, no sobre el del navegador.
 */
export function hoyISO(): string {
  return hoyVE()
}

export interface OperationDay {
  fecha: string
  largo: string
  corto: string
  esHoy: boolean
  setFecha: (fecha: string) => void
  volverAHoy: () => void
}

/**
 * Fecha de operación de la vista: hoy por defecto, con "volver a hoy".
 *
 * El estado vive en `useDashboardDateStore` para que el Análisis Mensual vea el
 * mismo día (su periodo se deriva de esta fecha).
 */
export function useOperationDay(): OperationDay {
  const fecha = useDashboardDateStore((estado) => estado.fecha)
  const setFecha = useDashboardDateStore((estado) => estado.setFecha)
  const volverAHoy = useCallback(() => setFecha(hoyISO()), [setFecha])

  return useMemo(
    () => ({
      fecha,
      largo: formatoLargo(fecha),
      corto: formatoCorto(fecha),
      esHoy: fecha === hoyISO(),
      setFecha,
      volverAHoy,
    }),
    [fecha, setFecha, volverAHoy],
  )
}
