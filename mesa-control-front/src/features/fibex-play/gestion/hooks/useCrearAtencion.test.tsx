import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { crearAtencion } from '../../../../lib/api/fibex-play-gestion'
import type {
  CrearAtencionPayload,
  RegistroAtencion,
} from '../../../../lib/api/types'
import { useCrearAtencion } from './useCrearAtencion'

vi.mock('../../../../lib/api/fibex-play-gestion', () => ({
  crearAtencion: vi.fn(),
}))
const crearMock = vi.mocked(crearAtencion)

const payload: CrearAtencionPayload = {
  operadorId: 'u-1',
  abonado: '1002451',
  canal: 'ESPN',
  motivo: 'Sin señal',
  solucion: 'Reinicio de ONU',
  estado: 'SOLUCIONADO',
}

const registro: RegistroAtencion = {
  id: 'a-1',
  operador: 'Jhon Rivas',
  ...payload,
  creadoEn: '2026-07-22T14:12:00.000Z',
}

describe('useCrearAtencion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    crearMock.mockResolvedValue(registro)
  })

  it('al crear invalida la query de la bitácora', async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useCrearAtencion(), { wrapper })
    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(crearMock).toHaveBeenCalledWith(payload)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['fibex-play-gestion'] })
  })
})
