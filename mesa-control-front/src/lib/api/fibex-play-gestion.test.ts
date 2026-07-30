import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from './client'
import {
  crearAtencion,
  fetchFibexPlayGestion,
  vacioGestion,
} from './fibex-play-gestion'
import type { CrearAtencionPayload, GestionResumen } from './types'

vi.mock('./client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

const getMock = vi.mocked(api.get)
const postMock = vi.mocked(api.post)

const RESUMEN: GestionResumen = {
  kpis: { totalAtendidos: 24, solucionados: 16, enProceso: 5, escalados: 3 },
  topCanales: [{ canal: 'ESPN', total: 6 }],
  origen: [{ origen: 'Señal / Transmisión', total: 10 }],
  registros: [
    {
      id: 'a-1',
      operador: 'Jhon Rivas',
      abonado: '1002451',
      canal: 'ESPN',
      motivo: 'Sin señal',
      solucion: 'Reinicio de ONU',
      estado: 'SOLUCIONADO',
      creadoEn: '2026-07-22T14:12:00.000Z',
    },
  ],
  catalogos: {
    canales: ['ESPN'],
    motivos: ['Sin señal'],
    soluciones: ['Reinicio de ONU'],
    estados: ['SOLUCIONADO', 'EN_PROCESO', 'ESCALADO'],
  },
}

describe('fetchFibexPlayGestion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('devuelve el resumen del back', async () => {
    getMock.mockResolvedValue({ data: RESUMEN })
    expect(await fetchFibexPlayGestion()).toEqual(RESUMEN)
    expect(getMock).toHaveBeenCalledWith('/fibex-play/gestion')
  })

  it('degrada a estado vacío ante error/404', async () => {
    getMock.mockRejectedValue(new Error('404'))
    const vacio = await fetchFibexPlayGestion()
    expect(vacio.kpis).toEqual({
      totalAtendidos: 0,
      solucionados: 0,
      enProceso: 0,
      escalados: 0,
    })
    expect(vacio.topCanales).toEqual([])
    expect(vacio.origen).toEqual([])
    expect(vacio.registros).toEqual([])
    expect(vacio.catalogos).toEqual({
      canales: [],
      motivos: [],
      soluciones: [],
      estados: [],
    })
  })
})

describe('crearAtencion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hace POST con el payload y devuelve el registro creado', async () => {
    const payload: CrearAtencionPayload = {
      operadorId: 'u-1',
      abonado: '1002451',
      canal: 'ESPN',
      motivo: 'Sin señal',
      solucion: 'Reinicio de ONU',
      estado: 'SOLUCIONADO',
    }
    postMock.mockResolvedValue({ data: RESUMEN.registros[0] })
    const creado = await crearAtencion(payload)
    expect(postMock).toHaveBeenCalledWith('/fibex-play/gestion', payload)
    expect(creado).toEqual(RESUMEN.registros[0])
  })
})

describe('vacioGestion', () => {
  it('produce KPIs en 0 y arrays/catálogos vacíos', () => {
    const vacio = vacioGestion()
    expect(vacio.kpis.totalAtendidos).toBe(0)
    expect(vacio.registros).toHaveLength(0)
    expect(vacio.catalogos.canales).toHaveLength(0)
  })
})
