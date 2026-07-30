import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { api } from './client'
import { createGestion, getGestion, updateGestion } from './gestiones'
import type { CreateGestionRequest, GestionResponse } from './types'

const payload: CreateGestionRequest = {
  operadorId: 'u-1',
  fecha: '2026-07-22',
  abonado: '100245',
  nombreCliente: 'María Pérez',
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
  codigo: 'LG-40921',
  fecha: '2026-07-22',
  operador: { id: 'u-1', nombre: 'Jhon Rivas' },
  abonado: '100245',
  nombreCliente: 'María Pérez',
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

  it('hace GET /gestiones/:id y devuelve el detalle tipado', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: respuesta })

    await expect(getGestion('g-1')).resolves.toEqual(respuesta)
    expect(get).toHaveBeenCalledWith('/gestiones/g-1')
  })

  it('hace PATCH /gestiones/:id con el body parcial', async () => {
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: respuesta })

    await expect(
      updateGestion('g-1', { observacion: 'Corregido' }),
    ).resolves.toEqual(respuesta)
    expect(patch).toHaveBeenCalledWith('/gestiones/g-1', {
      observacion: 'Corregido',
    })
  })

  it('propaga el 403/404 del PATCH para que la vista lo muestre', async () => {
    const error = new AxiosError('Forbidden', 'ERR_BAD_REQUEST', undefined, null, {
      status: 403,
      statusText: '',
      data: { statusCode: 403, message: 'Forbidden resource' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    })
    vi.spyOn(api, 'patch').mockRejectedValue(error)

    await expect(updateGestion('g-1', { zona: 'Macuto' })).rejects.toBe(error)
  })
})
