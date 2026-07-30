import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateGestion } from '../../../lib/api/gestiones'
import type { GestionResponse, UpdateGestionRequest } from '../../../lib/api/types'
import { useEditarGestion } from './useEditarGestion'

vi.mock('../../../lib/api/gestiones', () => ({ updateGestion: vi.fn() }))
const updateMock = vi.mocked(updateGestion)

const payload: UpdateGestionRequest = {
  abonado: '100245',
  observacion: 'Corregido',
}

describe('useEditarGestion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateMock.mockResolvedValue({ id: 'g-1' } as GestionResponse)
  })

  it('llama a PATCH con el id y refresca historial, monitor y análisis', async () => {
    const client = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useEditarGestion('g-1'), { wrapper })
    result.current.mutate(payload)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(updateMock).toHaveBeenCalledWith('g-1', payload)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['historial'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['monitor-diario'] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['analisis-mensual'] })
  })
})
