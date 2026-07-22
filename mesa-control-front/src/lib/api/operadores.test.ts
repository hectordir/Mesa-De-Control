import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { getOperadores } from './operadores'
import type { OperadorOption } from './types'

const operadores: OperadorOption[] = [
  { id: 'u-2', nombre: 'Andrea Pérez' },
  { id: 'u-1', nombre: 'Jhon Rivas' },
]

describe('API de Operadores', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hace GET /operadores y devuelve la lista tipada', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: operadores })

    await expect(getOperadores()).resolves.toEqual(operadores)
    expect(get).toHaveBeenCalledWith('/operadores')
  })
})
