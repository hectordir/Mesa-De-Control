import { create } from 'zustand'
import { hoyISO } from '../features/dashboard/hooks/useOperationDay'

/**
 * Única fuente de verdad de la fecha del dashboard.
 *
 * Monitor Diario y Análisis Mensual comparten este valor: el periodo mensual se
 * **deriva** de la fecha (`fecha.slice(0, 7)`) en vez de vivir en un segundo
 * estado, así ambas vistas no pueden discrepar. No se persiste: al recargar la
 * página se vuelve a hoy.
 */
export interface DashboardDateState {
  /** YYYY-MM-DD */
  fecha: string
  setFecha: (fecha: string) => void
}

export const useDashboardDateStore = create<DashboardDateState>()((set) => ({
  fecha: hoyISO(),
  setFecha: (fecha) => set({ fecha }),
}))
