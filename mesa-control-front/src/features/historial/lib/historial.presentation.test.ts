import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  esZebra,
  formatAbonado,
  formatFecha,
  gestionesToCsv,
  iniciales,
  mesEnCurso,
  rangoPagina,
  textoODash,
} from './historial.presentation'
import type { GestionRow } from '../../../lib/api/types'

const fila = (over: Partial<GestionRow> = {}): GestionRow => ({
  id: 'clx1',
  codigo: 'LG-40921',
  operador: { id: 'op-1', nombre: 'Jhon Rivas', iniciales: 'JR' },
  abonado: '1002451',
  nombreCliente: 'María Pérez',
  telefono: '0412-118-4420',
  zona: 'Norte',
  canal: 'TELEGRAM',
  resultado: 'ESCALADO_NOC',
  fecha: '2026-07-17',
  hora: '10:42',
  duracionMin: 134,
  detalle: 'Corte total de fibra',
  solucion: 'Ticket generado a NOC',
  modificadaFecha: null,
  modificadaHora: null,
  editor: null,
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

  it('degrada a guion los textos vacíos de las celdas', () => {
    expect(textoODash('María Pérez')).toBe('María Pérez')
    expect(textoODash('')).toBe('—')
    expect(textoODash('   ')).toBe('—')
  })

  it('prefija el abonado Fibex con LG- para mostrarlo', () => {
    expect(formatAbonado('1002451')).toBe('LG-1002451')
  })

  it('nunca devuelve un LG- suelto: sin abonado degrada a guion como textoODash', () => {
    expect(formatAbonado('')).toBe('—')
    expect(formatAbonado('   ')).toBe('—')
    expect(formatAbonado(null)).toBe('—')
    expect(formatAbonado(undefined)).toBe('—')
  })

  it('genera CSV con cabecera y filas, escapando comas y comillas', () => {
    const csv = gestionesToCsv([
      fila(),
      fila({
        codigo: 'LG-1',
        nombreCliente: 'Casa "A", 2',
        canal: null,
        duracionMin: null,
      }),
    ])
    const lineas = csv.split('\n')
    expect(lineas[0]).toBe(
      'Abonado,Operador,Cliente,Telefono,Zona,Resultado,Fecha,Hora',
    )
    // el resultado se traduce a etiqueta legible; ESCALADO_NOC → Escalado a NOC
    expect(lineas[1]).toBe(
      'LG-1002451,Jhon Rivas,María Pérez,0412-118-4420,Norte,Escalado a NOC,17/07/2026,10:42',
    )
    // el cliente con coma y comillas queda entrecomillado con comillas dobladas
    expect(lineas[2]).toContain('"Casa ""A"", 2"')
  })

  it('no exporta Canal ni Duracion: no se capturan en el formulario', () => {
    const csv = gestionesToCsv([fila()])
    expect(csv).not.toContain('Canal')
    expect(csv).not.toContain('Duracion')
    expect(csv).not.toContain('TELEGRAM')
    expect(csv).not.toContain('2h 14m')
  })

  it('el CSV exporta el abonado Fibex prefijado y nunca el código derivado del id', () => {
    const csv = gestionesToCsv([fila({ abonado: '9988776', codigo: 'LG-40921' })])
    expect(csv).toContain('LG-9988776,Jhon Rivas,')
    // `codigo` (LG-#### derivado del id de BD) sigue sin exportarse
    expect(csv).not.toContain('LG-40921')
    expect(csv).not.toContain('Codigo')
  })
})

describe('mesEnCurso · rango por defecto del historial', () => {
  const TZ_ORIGINAL = process.env.TZ

  beforeEach(() => {
    // Navegador en UTC: a las 02:00 Z del 1 de agosto en Caracas es 31 de julio.
    process.env.TZ = 'UTC'
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-01T02:00:00.000Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
    process.env.TZ = TZ_ORIGINAL
  })

  it('usa el mes venezolano en curso, no el del navegador', () => {
    expect(new Date().getMonth()).toBe(7) // guarda: el host sí está en UTC (agosto)
    expect(mesEnCurso()).toEqual({ desde: '2026-07-01', hasta: '2026-07-31' })
  })

  it('calcula el último día de un mes de 30 y de febrero bisiesto', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
    expect(mesEnCurso().hasta).toBe('2026-06-30')

    vi.setSystemTime(new Date('2024-02-15T12:00:00.000Z'))
    expect(mesEnCurso().hasta).toBe('2024-02-29')
  })
})
