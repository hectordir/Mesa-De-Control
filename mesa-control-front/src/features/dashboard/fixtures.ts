import type { MonitorDiarioResumen } from '../../lib/api/types'

/**
 * Datos de ejemplo del Monitor Diario (los mismos números del diseño).
 * TEMPORAL: el backend aún no expone `GET /dashboard/monitor-diario`; cuando lo
 * haga, sólo `src/lib/api/dashboard.ts` cambia y este archivo se borra.
 */
export const RESUMEN_DEMO: MonitorDiarioResumen = {
  fecha: '2026-07-17',
  kpis: {
    clientesAtendidos: 342,
    efectividadMesa: 78,
    enviadoSoporte2: 54,
    escaladoNoc: 31,
    pendienteCliente: 38,
  },
  operadores: [
    { id: 'op-1', nombre: 'Jhon Rivas', clientes: 78, mesa: 63, soporte2: 11, noc: 7 },
    { id: 'op-2', nombre: 'María León', clientes: 66, mesa: 52, soporte2: 9, noc: 6 },
    { id: 'op-3', nombre: 'Carlos Díaz', clientes: 59, mesa: 40, soporte2: 13, noc: 6 },
    { id: 'op-4', nombre: 'Ana Quintero', clientes: 71, mesa: 58, soporte2: 10, noc: 7 },
    { id: 'op-5', nombre: 'Luis Parra', clientes: 68, mesa: 54, soporte2: 11, noc: 5 },
  ],
  distribucion: [
    { resultado: 'SOLUCIONADO_MESA', total: 198 },
    { resultado: 'ENVIADO_SOPORTE2', total: 54 },
    { resultado: 'ESCALADO_NOC', total: 31 },
    { resultado: 'PENDIENTE_CLIENTE', total: 38 },
    { resultado: 'REAGENDADO', total: 21 },
  ],
  topAverias: [
    { motivo: 'Corte de fibra (FTTH)', total: 84 },
    { motivo: 'Sin señal / ONT', total: 61 },
    { motivo: 'Lentitud de navegación', total: 47 },
    { motivo: 'Falla en IPTV', total: 33 },
    { motivo: 'WiFi intermitente', total: 28 },
  ],
  actividad: [
    {
      id: 'act-1',
      operador: 'Jhon Rivas',
      resultado: 'SOLUCIONADO_MESA',
      ubicacion: 'Cond. Los Robles',
      hora: '2026-07-17T10:42:00-04:00',
    },
    {
      id: 'act-2',
      operador: 'María León',
      resultado: 'ENVIADO_SOPORTE2',
      ubicacion: 'Torre Aurora',
      hora: '2026-07-17T10:39:00-04:00',
    },
    {
      id: 'act-3',
      operador: 'Carlos Díaz',
      resultado: 'ESCALADO_NOC',
      ubicacion: 'Res. El Mirador',
      hora: '2026-07-17T10:31:00-04:00',
    },
    {
      id: 'act-4',
      operador: 'Ana Quintero',
      resultado: 'PENDIENTE_CLIENTE',
      ubicacion: 'Plaza Central',
      hora: '2026-07-17T10:25:00-04:00',
    },
    {
      id: 'act-5',
      operador: 'Luis Parra',
      resultado: 'SOLUCIONADO_MESA',
      ubicacion: 'Barrio San Luis',
      hora: '2026-07-17T10:18:00-04:00',
    },
  ],
}

/** Jornada sin gestiones registradas: alimenta el estado vacío del diseño. */
export const RESUMEN_VACIO: MonitorDiarioResumen = {
  fecha: '2026-07-17',
  kpis: {
    clientesAtendidos: 0,
    efectividadMesa: 0,
    enviadoSoporte2: 0,
    escaladoNoc: 0,
    pendienteCliente: 0,
  },
  operadores: [],
  distribucion: [],
  topAverias: [],
  actividad: [],
}

/** Copia con la fecha solicitada, para que el chip y los datos concuerden. */
export function resumenDemo(fecha: string): MonitorDiarioResumen {
  return { ...RESUMEN_DEMO, fecha }
}
