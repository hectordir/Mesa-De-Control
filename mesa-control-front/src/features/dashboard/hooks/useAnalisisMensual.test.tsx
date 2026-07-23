import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useAnalisisMensual, vacioMensual } from './useAnalisisMensual'
import { fetchAnalisisMensual } from '../../../lib/api/dashboard'
import { createTestQueryClient } from '../../../test/renderWithProviders'
import type { AnalisisMensualResponse } from '../../../lib/api/types'

vi.mock('../../../lib/api/dashboard', () => ({
  fetchAnalisisMensual: vi.fn(),
}))

const fetchMock = vi.mocked(fetchAnalisisMensual)

const client = createTestQueryClient()
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
)

const RESPUESTA: AnalisisMensualResponse = {
  periodo: '2026-05',
  kpis: { volumen: 485, resueltos: 209, escalados: 22, metaEfectividad: 65 },
  serie: [{ mes: 'Mayo', periodo: '2026-05', resueltas: 209, resto: 276 }],
  heatmap: { motivos: ['Falla LOS'], zonas: [{ zona: 'Macuto', valores: [3] }] },
  distribucion: [{ motivo: 'Falla LOS', total: 140 }],
  operadores: [
    { id: 'o1', nombre: 'José V.', solucionados: 79, enviadosN2: 67, total: 159 },
  ],
  tendencia: [{ fecha: '2026-05-20', atendidos: 40 }],
}

beforeEach(() => {
  vi.clearAllMocks()
  client.clear()
})

describe('useAnalisisMensual', () => {
  it('consulta el periodo pedido', async () => {
    fetchMock.mockResolvedValue(RESPUESTA)
    const { result } = renderHook(() => useAnalisisMensual('2026-05'), { wrapper })

    await waitFor(() => expect(result.current.data).toEqual(RESPUESTA))
    expect(fetchMock).toHaveBeenCalledWith('2026-05')
  })

  it('propaga el fallo de red o de servidor como error de la consulta', async () => {
    fetchMock.mockRejectedValue(new Error('Network Error'))
    const { result } = renderHook(() => useAnalisisMensual('2026-04'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.data).toBeUndefined()
  })

  it('un mes sin gestiones llega como 200 con volumen 0, no como error', async () => {
    fetchMock.mockResolvedValue(vacioMensual('2026-04'))
    const { result } = renderHook(() => useAnalisisMensual('2026-04'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.isError).toBe(false)
    expect(result.current.data?.kpis.volumen).toBe(0)
  })
})
