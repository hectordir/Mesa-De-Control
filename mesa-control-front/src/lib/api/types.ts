/** Contratos compartidos con `mesa-control-back` (ver spec `acceso-login-jwt`). */

export type Role = 'OPERADOR' | 'SUPERVISOR' | 'ADMIN'

export interface PublicUser {
  id: string
  email: string
  name: string
  role: Role
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: PublicUser
}

/* ── Dashboard · Monitor Diario (ver spec `dashboard-monitor-diario`) ────────
   Endpoint previsto: GET /dashboard/monitor-diario?fecha=YYYY-MM-DD          */

export type ResultadoGestion =
  | 'SOLUCIONADO_MESA'
  | 'ENVIADO_SOPORTE2'
  | 'ESCALADO_NOC'
  | 'PENDIENTE_CLIENTE'
  | 'REAGENDADO'

export interface KpiResumen {
  clientesAtendidos: number
  /** 0–100 */
  efectividadMesa: number
  enviadoSoporte2: number
  escaladoNoc: number
  pendienteCliente: number
}

/** `iniciales` y `efectividad` se derivan en el front, no viajan por la API. */
export interface OperadorResumen {
  id: string
  nombre: string
  clientes: number
  mesa: number
  soporte2: number
  noc: number
}

export interface DistribucionItem {
  resultado: ResultadoGestion
  total: number
}

export interface AveriaItem {
  motivo: string
  total: number
}

export interface ActividadItem {
  id: string
  operador: string
  resultado: ResultadoGestion
  ubicacion: string
  /** ISO 8601 */
  hora: string
}

export interface MonitorDiarioResumen {
  /** YYYY-MM-DD */
  fecha: string
  kpis: KpiResumen
  operadores: OperadorResumen[]
  distribucion: DistribucionItem[]
  /** ya ordenado desc, máx 5 */
  topAverias: AveriaItem[]
  /** ya ordenado desc por hora */
  actividad: ActividadItem[]
}

/* ── Dashboard · Análisis Mensual (ver spec `dashboard-analisis-mensual`) ────
   Endpoint previsto: GET /dashboard/analisis-mensual?periodo=YYYY-MM
   TODO: aún no publicado por el back; la vista degrada a estado vacío.       */

export interface AnalisisMensualKpis {
  volumen: number
  resueltos: number
  escalados: number
  /** 0–100, meta de equipo (por defecto 65). */
  metaEfectividad: number
}

export interface AnalisisMensualBar {
  /** Nombre del mes, p. ej. `Febrero`. */
  mes: string
  /** YYYY-MM */
  periodo: string
  resueltas: number
  resto: number
}

export interface AnalisisMensualHeatmap {
  /** Columnas del mapa de calor. */
  motivos: string[]
  /** `valores.length === motivos.length` en cada fila. */
  zonas: { zona: string; valores: number[] }[]
}

export interface AnalisisMensualResponse {
  /** YYYY-MM */
  periodo: string
  kpis: AnalisisMensualKpis
  /** Últimos 4 meses, en orden cronológico. */
  serie: AnalisisMensualBar[]
  heatmap: AnalisisMensualHeatmap
}
