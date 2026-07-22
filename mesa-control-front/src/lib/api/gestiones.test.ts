import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { api } from './client'
import { createGestion } from './gestiones'
import type { CreateGestionRequest, GestionResponse } from './types'

const payload: CreateGestionRequest = {
  fecha: '2026-07-22',
  abonado: 'Cond. Los Robles',
  telefono: '0412 555 1234',
  detalle: 'Sin Internet',
  solucion: 'Reinicio de ONU',
  resultado: 'SOLUCIONADO_MESA',
  tipo: 'Mesa',
  requiereVisita: false,
  zona: 'Macuto',
  motivo: 'Corte de fibra',
  observacion: 'Cliente conforme',
  coordenadas: '10.6012, -66.9311',
}

const respuesta: GestionResponse = {
  id: 'g-1',
  fecha: '2026-07-22',
  operador: { id: 'u-1', nombre: 'Jhon Rivas' },
  abonado: 'Cond. Los Robles',
  telefono: '0412 555 1234',
  detalle: 'Sin Internet',
  solucion: 'Reinicio de ONU',
  resultado: 'SOLUCIONADO_MESA',
  tipo: 'Mesa',
  requiereVisita: false,
  zona: 'Macuto',
  motivo: 'Corte de fibra',
  observacion: 'Cliente conforme',
  coordenadas: '10.6012, -66.9311',
  createdAt: '2026-07-22T10:42:00.000Z',
}

describe('API de Gestiones', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hace POST /gestiones con el body y devuelve la respuesta tipada', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: respuesta })

    await expect(createGestion(payload)).resolves.toEqual(respuesta)
    expect(post).toHaveBeenCalledWith('/gestiones', payload)
  })

  it('propaga el error del cliente HTTP para que la vista lo muestre', async () => {
    const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, null, {
      status: 400,
      statusText: '',
      data: { statusCode: 400, message: 'abonado should not be empty' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    vi.spyOn(api, 'post').mockRejectedValue(error)

    await expect(createGestion(payload)).rejects.toBe(error)
  })
})
