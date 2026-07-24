import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import { deleteGestiones, fetchSupervisionResumen } from './supervision'
import type { DeleteGestionesResult, SupervisionResumen } from './types'

const resumen: SupervisionResumen = {
  fecha: '2026-07-23',
  kpis: {
    atendidosHoy: 142,
    atendidosDelta: 12,
    efectividad: 87,
    efectividadMeta: 85,
    escaladosNoc: 9,
    escaladosDelta: -3,
    slaCumplido: 94,
    slaMeta: 90,
  },
  zonas: [{ nombre: 'Caraballeda', count: 14, estado: 'danger' }],
  bandejaN2: [],
  sla: [
    { key: '0', label: '0 días', count: 5 },
    { key: '1', label: '1 día', count: 3 },
    { key: '2', label: '2 días', count: 2 },
    { key: '3', label: '3 días', count: 1 },
    { key: '4+', label: '4+ días', count: 2 },
  ],
  heatmap: { motivos: ['Falla LOS'], filas: [{ zona: 'Caraballeda', celdas: [4], total: 4 }] },
  depuracion: [{ id: 'g-1', fecha: '2026-07-23', operador: 'José V.', abonado: 'LG18823' }],
}

describe('API de Supervisión', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('hace GET /supervision/resumen con la fecha y devuelve la respuesta tipada', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: resumen })

    await expect(fetchSupervisionResumen('2026-07-23')).resolves.toEqual(resumen)
    expect(get).toHaveBeenCalledWith('/supervision/resumen', {
      params: { fecha: '2026-07-23' },
    })
  })

  it('sin fecha consulta el resumen del día por defecto (sin params)', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: resumen })

    await fetchSupervisionResumen()
    expect(get).toHaveBeenCalledWith('/supervision/resumen', { params: {} })
  })

  it('DELETE /supervision/gestiones envía los ids en el body y devuelve el conteo', async () => {
    const result: DeleteGestionesResult = { deleted: 2 }
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: result })

    await expect(deleteGestiones(['a', 'b'])).resolves.toEqual(result)
    expect(del).toHaveBeenCalledWith('/supervision/gestiones', {
      data: { ids: ['a', 'b'] },
    })
  })
})
