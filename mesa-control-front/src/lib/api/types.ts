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

/** Un motivo con su volumen de gestiones en el mes. */
export interface AnalisisMensualMotivo {
  motivo: string
  /** Gestiones del mes con ese motivo. */
  total: number
}

/** Productividad de un operador en el mes. */
export interface AnalisisMensualOperador {
  id: string
  nombre: string
  /** resultado = SOLUCIONADO_MESA */
  solucionados: number
  /** resultado = ENVIADO_SOPORTE2 (Nivel 2) */
  enviadosN2: number
  /** Todas las gestiones del operador en el mes. */
  total: number
}

/** Gestiones atendidas en un día concreto del mes. */
export interface AnalisisMensualDia {
  /** YYYY-MM-DD */
  fecha: string
  atendidos: number
}

export interface AnalisisMensualResponse {
  /** YYYY-MM */
  periodo: string
  kpis: AnalisisMensualKpis
  /** Últimos 4 meses, en orden cronológico. */
  serie: AnalisisMensualBar[]
  heatmap: AnalisisMensualHeatmap
  /** Todos los motivos del mes, orden desc por total. */
  distribucion: AnalisisMensualMotivo[]
  /** Operadores con gestiones en el mes, orden desc por total. */
  operadores: AnalisisMensualOperador[]
  /** Solo días con gestiones, orden cronológico. */
  tendencia: AnalisisMensualDia[]
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

/* ── Historial General (ver spec `historial-general`) ─────────────────────────
   Endpoint: GET /gestiones (JWT). Listado paginado + filtrado + ordenado, con
   contadores por resultado para las chips. Filtrado/orden/paginación server-side. */

export type CanalGestion = 'LLAMADA' | 'WHATSAPP' | 'TELEGRAM'

/** Columnas ordenables (server-side). */
export type HistorialSortKey =
  | 'fecha'
  | 'operador'
  | 'abonado'
  | 'resultado'
  | 'zona'

export type SortDir = 'asc' | 'desc'

/** Fila de la sábana de gestiones; todo el detalle del drawer viaja aquí. */
export interface GestionRow {
  id: string
  /** id legible `GST-#####`, estable y determinista (lo deriva el back). */
  codigo: string
  operador: { id: string; nombre: string; iniciales: string }
  abonado: string
  telefono: string
  /** = ubicacion. */
  zona: string
  canal: CanalGestion | null
  resultado: ResultadoGestion
  /** YYYY-MM-DD */
  fecha: string
  /** HH:mm derivado de createdAt. */
  hora: string
  duracionMin: number | null
  detalle: string
  solucion: string
}

export interface HistorialParams {
  page?: number
  pageSize?: number
  search?: string
  /** YYYY-MM-DD, filtra fecha >= desde. */
  desde?: string
  /** YYYY-MM-DD, filtra fecha <= hasta. */
  hasta?: string
  resultado?: ResultadoGestion
  sortKey?: HistorialSortKey
  sortDir?: SortDir
}

export interface HistorialResponse {
  items: GestionRow[]
  /** Total filtrado (para paginación y "de N"). */
  total: number
  page: number
  pageSize: number
  counts: {
    /** Total (para la chip "Todos"), independiente del filtro `resultado`. */
    total: number
    /** groupBy por resultado, independiente del filtro `resultado`. */
    porResultado: Record<string, number>
  }
}

/* ── Fibex Play · Grilla en Vivo (ver spec `fibex-play-grilla`, §2.3) ─────────
   Endpoint: GET /fibex-play (JWT). Snapshot en vivo de la grilla de canales.
   Los enums llegan como strings; el front mapea a etiqueta/color en
   `features/fibex-play/lib/fibexPlay.presentation.ts`.                        */

export type CategoriaCanal =
  | 'DEPORTES'
  | 'INFANTIL'
  | 'NOTICIAS'
  | 'DOCUMENTALES'
  | 'PREMIUM'
  | 'GENERAL'
  | 'MUSICA'

export type TipoIncidencia =
  | 'SIN_SENAL'
  | 'VIDEO_PIXELADO'
  | 'IMAGEN_CONGELADA'
  | 'AUDIO_DESINCRONIZADO'
  | 'SENAL_INTERMITENTE'

export type SeveridadIncidencia = 'CRITICA' | 'ALTA' | 'MEDIA'

export interface FibexPlayKpis {
  total: number
  operativos: number
  caidos: number
  /** 0–100, round(operativos/total*100); 100 si total=0. */
  saludGrilla: number
}

export interface DistribucionSeveridadItem {
  severidad: SeveridadIncidencia
  total: number
}

/** Canal caído; alimenta Detalles de Falla y el timeline de Novedades. */
export interface FallaCanal {
  id: string
  nombre: string
  categoria: CategoriaCanal
  tipoIncidencia: TipoIncidencia
  severidad: SeveridadIncidencia
  /** HH:mm derivado de `detectadoEn`. */
  hora: string
  /** ISO instante de la caída. */
  detectadoEn: string
}

export interface FibexPlayResumen {
  /** ISO instante (now del servidor). */
  actualizadoEn: string
  kpis: FibexPlayKpis
  /** Solo severidades con total>0, orden Crítica→Alta→Media. */
  distribucionSeveridad: DistribucionSeveridadItem[]
  /** Canales CAIDO, orden por `detectadoEn` asc. */
  fallas: FallaCanal[]
}

/* ── Fibex Play · Gestión de Clientes (ver spec `fibex-play-gestion`, §2.4) ───
   Endpoints: GET/POST /fibex-play/gestion (JWT). Bitácora de atención a
   reportes de la App Fibex. Los estados llegan como strings de enum; el front
   mapea etiqueta/color en `features/fibex-play/gestion/lib/gestion.presentation.ts`. */

export type EstadoAtencion = 'SOLUCIONADO' | 'EN_PROCESO' | 'ESCALADO'

export interface GestionKpis {
  totalAtendidos: number
  solucionados: number
  enProceso: number
  escalados: number
}

/** Canal reportado con su total; el panel dibuja la barra según el máximo. */
export interface TopCanalItem {
  canal: string
  total: number
}

/** Categoría de origen (derivada del motivo en el back) con su total. */
export interface OrigenItem {
  origen: string
  total: number
}

/** Registro de la bitácora; `operador` ya viaja resuelto a nombre. */
export interface RegistroAtencion {
  id: string
  operador: string
  abonado: string
  canal: string
  motivo: string
  solucion: string
  estado: EstadoAtencion
  /** ISO instante de creación. */
  creadoEn: string
}

/** Catálogos que pueblan los selects del formulario (sin operadores). */
export interface GestionCatalogos {
  canales: string[]
  motivos: string[]
  soluciones: string[]
  estados: EstadoAtencion[]
}

export interface GestionResumen {
  kpis: GestionKpis
  /** Desc por total, top 5. */
  topCanales: TopCanalItem[]
  /** Por categoría con total>0, orden fijo del catálogo. */
  origen: OrigenItem[]
  /** Desc por `creadoEn`. */
  registros: RegistroAtencion[]
  catalogos: GestionCatalogos
}

/** Cuerpo de `POST /fibex-play/gestion`. El front envía valores de catálogo. */
export interface CrearAtencionPayload {
  operadorId: string
  abonado: string
  canal: string
  motivo: string
  solucion: string
  estado: EstadoAtencion
}
