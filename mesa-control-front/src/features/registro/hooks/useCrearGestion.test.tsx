import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGestion } from '../../../lib/api/gestiones'
import type { CreateGestionRequest, GestionResponse } from '../../../lib/api/types'
import { useCrearGestion } from './useCrearGestion'

vi.mock('../../../lib/api/gestiones', () => ({ createGestion: vi.fn() }))
const createMock = vi.mocked(createGestion)

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
  coordenadas: null,
}

const respuesta = { id: 'g-1', ...payload, operador: { id: 'u-1', nombre: 'Jhon' }, createdAt: 'x' } as unknown as GestionResponse

describe('useCrearGestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createMock.mockResolvedValue(respuesta)
  })

  it('al crear invalida las queries de monitor diario y análisis mensual', async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCrearGestion(), { wrapper })
    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createMock).toHaveBeenCalledWith(payload)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['monitor-diario'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['analisis-mensual'] })
  })
})
