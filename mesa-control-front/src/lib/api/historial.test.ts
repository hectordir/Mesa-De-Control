import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { api } from './client'
import { fetchHistorial } from './historial'
import type { HistorialResponse } from './types'

const respuesta: HistorialResponse = {
  items: [
    {
      id: 'clx1',
      codigo: 'LG-40921',
      operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
      abonado: '1002451',
      nombreCliente: 'María Pérez',
      telefono: '0412-118-4420',
      zona: 'Norte',
      canal: 'TELEGRAM',
      resultado: 'ESCALADO_NOC',
      fecha: '2026-07-17',
      hora: '10:42',
      duracionMin: 134,
      detalle: 'Corte total de fibra',
      solucion: 'Ticket generado a NOC',
      modificadaFecha: null,
      modificadaHora: null,
      editor: null,
    },
  ],
  total: 248,
  page: 1,
  pageSize: 10,
  counts: { total: 248, porResultado: { ESCALADO_NOC: 84 } },
}

describe('API del Historial General', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hace GET /gestiones con los params y devuelve la respuesta tipada', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: respuesta })
    const params = {
      page: 1,
      pageSize: 10,
      search: 'pérez',
      resultado: 'ESCALADO_NOC' as const,
      sortKey: 'fecha' as const,
      sortDir: 'desc' as const,
    }

    await expect(fetchHistorial(params)).resolves.toEqual(respuesta)
    expect(get).toHaveBeenCalledWith('/gestiones', { params })
  })

  it('propaga el error del cliente HTTP para el estado de error de la vista', async () => {
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
      status: 400,
      statusText: '',
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    vi.spyOn(api, 'get').mockRejectedValue(error)

    await expect(fetchHistorial({ page: 99 })).rejects.toBe(error)
  })
})
