import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { historialKey, useHistorial } from './useHistorial'
import { fetchHistorial } from '../../../lib/api/historial'
import { createTestQueryClient } from '../../../test/renderWithProviders'
import type { HistorialParams, HistorialResponse } from '../../../lib/api/types'

vi.mock('../../../lib/api/historial', () => ({
  fetchHistorial: vi.fn(),
}))

const fetchMock = vi.mocked(fetchHistorial)

const client = createTestQueryClient()
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

const RESPUESTA: HistorialResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  counts: { total: 0, porResultado: {} },
}

beforeEach(() => {
  vi.clearAllMocks()
  client.clear()
})

describe('useHistorial', () => {
  it('construye la queryKey a partir de los filtros', () => {
    const params: HistorialParams = {
      page: 2,
      search: 'robles',
      resultado: 'ESCALADO_NOC',
      sortKey: 'operador',
      sortDir: 'asc',
    }
    expect(historialKey(params)).toEqual(['historial', params])
  })

  it('consulta el servicio con los params y expone la respuesta', async () => {
    fetchMock.mockResolvedValue(RESPUESTA)
    const params: HistorialParams = { page: 1, pageSize: 10, sortKey: 'fecha', sortDir: 'desc' }
    const { result } = renderHook(() => useHistorial(params), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(RESPUESTA))
    expect(fetchMock).toHaveBeenCalledWith(params)
  })
})
