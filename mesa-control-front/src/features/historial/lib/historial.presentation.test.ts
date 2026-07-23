import { describe, expect, it } from 'vitest'
import {
  esZebra,
  formatDuracion,
  formatFecha,
  gestionesToCsv,
  iniciales,
  rangoPagina,
} from './historial.presentation'
import type { GestionRow } from '../../../lib/api/types'

const fila = (over: Partial<GestionRow> = {}): GestionRow => ({
  id: 'clx1',
  codigo: 'GST-40921',
  operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
  abonado: 'Cond. Los Robles',
  telefono: '0412-118-4420',
  zona: 'Norte',
  canal: 'TELEGRAM',
  resultado: 'ESCALADO_NOC',
  fecha: '2026-07-17',
  hora: '10:42',
  duracionMin: 134,
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  ...over,
})

describe('historial.presentation', () => {
  it('deriva iniciales del nombre del operador (máx 2, ? si vacío)', () => {
    expect(iniciales('Jhon Rivas')).toBe('JR')
    expect(iniciales('María')).toBe('MA')
    expect(iniciales('  ')).toBe('?')
  })

  it('formatea la fecha YYYY-MM-DD como DD/MM/YYYY', () => {
    expect(formatFecha('2026-07-17')).toBe('17/07/2026')
  })

  it('formatea la duración en minutos y degrada nulos con un guion', () => {
    expect(formatDuracion(45)).toBe('45 min')
    expect(formatDuracion(134)).toBe('2h 14m')
    expect(formatDuracion(null)).toBe('—')
  })

  it('marca zebra en las filas impares (0-indexed)', () => {
    expect(esZebra(0)).toBe(false)
    expect(esZebra(1)).toBe(true)
    expect(esZebra(2)).toBe(false)
  })

  it('calcula el rango visible de la página', () => {
    expect(rangoPagina(1, 10, 248)).toEqual({ desde: 1, hasta: 10 })
    expect(rangoPagina(25, 10, 248)).toEqual({ desde: 241, hasta: 248 })
    expect(rangoPagina(1, 10, 0)).toEqual({ desde: 0, hasta: 0 })
  })

  it('genera CSV con cabecera y filas, escapando comas y comillas', () => {
    const csv = gestionesToCsv([
      fila(),
      fila({ codigo: 'GST-1', abonado: 'Casa "A", 2', canal: null, duracionMin: null }),
    ])
    const lineas = csv.split('\n')
    expect(lineas[0]).toBe(
      'Codigo,Operador,Abonado,Telefono,Zona,Canal,Resultado,Fecha,Hora,Duracion',
    )
    // el resultado se traduce a etiqueta legible; ESCALADO_NOC → Escalado a NOC
    expect(lineas[1]).toBe(
      'GST-40921,Jhon Rivas,Cond. Los Robles,0412-118-4420,Norte,TELEGRAM,Escalado a NOC,17/07/2026,10:42,2h 14m',
    )
    // abonado con coma y comillas queda entrecomillado con comillas dobladas
    expect(lineas[2]).toContain('"Casa ""A"", 2"')
    // canal/duración nulos degradan a vacío/guion
    expect(lineas[2].endsWith(',,Escalado a NOC,17/07/2026,10:42,—')).toBe(true)
  })
})
