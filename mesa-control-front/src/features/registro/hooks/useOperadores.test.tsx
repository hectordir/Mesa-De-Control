import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOperadores } from '../../../lib/api/operadores'
import type { OperadorOption } from '../../../lib/api/types'
import { operadoresKey, useOperadores } from './useOperadores'

vi.mock('../../../lib/api/operadores', () => ({ getOperadores: vi.fn() }))
const getMock = vi.mocked(getOperadores)

const operadores: OperadorOption[] = [
  { id: 'u-1', nombre: 'Jhon Rivas' },
  { id: 'u-2', nombre: 'María Bastidas' },
]

describe('useOperadores', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getMock.mockResolvedValue(operadores)
  })

  it('la clave es estable', () => {
    expect(operadoresKey()).toEqual(['operadores'])
  })

  it('devuelve la lista de operadores desde la API', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useOperadores(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(operadores)
  })
})
