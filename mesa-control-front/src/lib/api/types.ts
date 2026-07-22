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

/* ── Registro · Nueva Gestión (ver spec `registro-nueva-gestion`, §9) ─────────
   Endpoint: POST /gestiones (requiere JWT). El front envía VALORES de enum,
   nunca etiquetas. Desde la Revisión 2 el `operadorId` viaja en el body (la
   autoría la determina el operador seleccionado, ya no el token).             */

/** Opción del select de operadores (`GET /operadores`, ordenado por nombre). */
export interface OperadorOption {
  id: string
  nombre: string
}

export interface CreateGestionRequest {
  /** * requerido — usuario (rol OPERADOR) al que se atribuye la gestión. */
  operadorId: string
  /** 'YYYY-MM-DD' (por defecto hoy). */
  fecha: string
  /** * requerido — nombre/condominio del cliente. */
  abonado: string
  /** * requerido — ej. '0412 555 1234'. */
  telefono: string
  /** * requerido — Detalle de Orden. */
  detalle: string
  /** * requerido — Solución Aplicada. */
  solucion: string
  /** Por defecto 'SOLUCIONADO_MESA'. */
  resultado: ResultadoGestion
  /** Tipo Resolución ('Mesa' | 'Soporte 2' | 'NOC' | 'Visita técnica'). */
  tipo: string
  requiereVisita: boolean
  /** * requerido — Zona del Reporte (se persiste en `ubicacion`). */
  zona: string
  /** * requerido — Motivo de la Incidencia. */
  motivo: string
  /** * requerido — Observación del SAE. */
  observacion: string
  /** Opcional — pin 'lat, lng'. */
  coordenadas: string | null
}

export interface GestionResponse {
  id: string
  /** 'YYYY-MM-DD' */
  fecha: string
  operador: { id: string; nombre: string }
  abonado: string
  telefono: string
  detalle: string
  solucion: string
  resultado: ResultadoGestion
  tipo: string
  requiereVisita: boolean
  zona: string
  motivo: string
  observacion: string
  coordenadas: string | null
  /** ISO instante */
  createdAt: string
}
