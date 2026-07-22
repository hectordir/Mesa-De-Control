import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { api } from './client'
import { fetchMonitorDiario } from './dashboard'
import type { MonitorDiarioResumen } from './types'

const resumen: MonitorDiarioResumen = {
  fecha: '2026-07-22',
  kpis: {
    clientesAtendidos: 342,
    efectividadMesa: 78,
    enviadoSoporte2: 54,
    escaladoNoc: 31,
    pendienteCliente: 38,
  },
  operadores: [
    { id: 'op-1', nombre: 'Jhon Rivas', clientes: 78, mesa: 63, soporte2: 11, noc: 7 },
  ],
  distribucion: [{ resultado: 'SOLUCIONADO_MESA', total: 198 }],
  topAverias: [{ motivo: 'Corte de fibra (FTTH)', total: 84 }],
  actividad: [
    {
      id: 'act-1',
      operador: 'Jhon Rivas',
      resultado: 'SOLUCIONADO_MESA',
      ubicacion: 'Cond. Los Robles',
      hora: '2026-07-22T10:42:00.000Z',
    },
  ],
}

describe('API del Monitor Diario', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hace GET /dashboard/monitor-diario con la fecha y devuelve la respuesta tipada', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: resumen })

    await expect(fetchMonitorDiario('2026-07-22')).resolves.toEqual(resumen)
    expect(get).toHaveBeenCalledWith('/dashboard/monitor-diario', {
      params: { fecha: '2026-07-22' },
    })
  })

  it('un día sin gestiones es una respuesta 200 vacía, no un error', async () => {
    const vacio: MonitorDiarioResumen = {
      fecha: '2026-07-21',
      kpis: {
        clientesAtendidos: 0,
        efectividadMesa: 0,
        enviadoSoporte2: 0,
        escaladoNoc: 0,
        pendienteCliente: 0,
      },
      operadores: [],
      distribucion: [
        { resultado: 'SOLUCIONADO_MESA', total: 0 },
        { resultado: 'ENVIADO_SOPORTE2', total: 0 },
        { resultado: 'ESCALADO_NOC', total: 0 },
        { resultado: 'PENDIENTE_CLIENTE', total: 0 },
        { resultado: 'REAGENDADO', total: 0 },
      ],
      topAverias: [],
      actividad: [],
    }
    vi.spyOn(api, 'get').mockResolvedValue({ data: vacio })

    await expect(fetchMonitorDiario('2026-07-21')).resolves.toEqual(vacio)
  })

  it('propaga el error del cliente HTTP para que la vista muestre el estado de error', async () => {
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
      status: 400,
      statusText: '',
      data: { statusCode: 400, message: 'fecha inválida' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    vi.spyOn(api, 'get').mockRejectedValue(error)

    await expect(fetchMonitorDiario('ayer')).rejects.toBe(error)
  })
})
