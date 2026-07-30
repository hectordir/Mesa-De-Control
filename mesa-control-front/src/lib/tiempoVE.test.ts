import { afterAll, describe, expect, it } from 'vitest'
import {
  ZONA_VE,
  fechaISOVE,
  fechaLargaVE,
  hoyVE,
  horaVE,
  mesActualVE,
} from './tiempoVE'

/**
 * Todo se ejecuta con la zona del "navegador" forzada a una MUY distinta de la
 * venezolana (Tokio, UTC+9, y Kiritimati, UTC+14, donde ya es el día siguiente).
 * Si el helper dependiera de la zona del host, estos casos fallarían.
 */
const TZ_ORIGINAL = process.env.TZ
const ZONAS_HOST = ['Asia/Tokyo', 'UTC', 'Pacific/Kiritimati', ZONA_VE] as const

function enCadaZonaHost(fn: () => void): void {
  for (const tz of ZONAS_HOST) {
    process.env.TZ = tz
    // Guarda de cordura: si el runtime ignorase el cambio de TZ el test sería
    // un falso verde, así que comprobamos que la zona SÍ está activa.
    if (tz === 'Asia/Tokyo') {
      expect(new Date('2026-07-17T12:00:00.000Z').getHours()).toBe(21)
    }
    fn()
  }
}

afterAll(() => {
  process.env.TZ = TZ_ORIGINAL
})

describe('horaVE', () => {
  it('formatea el instante en America/Caracas, no en la zona del navegador', () => {
    enCadaZonaHost(() => {
      expect(horaVE('2026-07-17T12:00:00.000Z')).toBe('08:00')
      expect(horaVE('2026-07-22T09:42:00.000Z')).toBe('05:42')
      expect(horaVE('2026-07-17T23:30:00.000Z')).toBe('19:30')
    })
  })

  it('respeta el offset del propio ISO', () => {
    enCadaZonaHost(() => {
      expect(horaVE('2026-07-17T10:42:00-04:00')).toBe('10:42')
    })
  })

  it('usa la zona IANA, así que aplica el offset histórico -04:30 (2007-2016)', () => {
    enCadaZonaHost(() => {
      expect(horaVE('2010-06-15T12:00:00.000Z')).toBe('07:30')
    })
  })

  it('devuelve cadena vacía si no es un instante válido', () => {
    expect(horaVE('ayer')).toBe('')
    expect(horaVE('')).toBe('')
  })
})

describe('fechaISOVE', () => {
  it('la madrugada UTC pertenece al día anterior en Caracas', () => {
    enCadaZonaHost(() => {
      expect(fechaISOVE('2026-07-18T02:00:00.000Z')).toBe('2026-07-17')
    })
  })

  it('no adelanta el día para navegadores al este de Caracas', () => {
    enCadaZonaHost(() => {
      expect(fechaISOVE('2026-07-22T20:00:00.000Z')).toBe('2026-07-22')
    })
  })

  it('devuelve cadena vacía si no es un instante válido', () => {
    expect(fechaISOVE('ayer')).toBe('')
  })
})

describe('fechaLargaVE', () => {
  it('nombra el día de la semana según Caracas', () => {
    enCadaZonaHost(() => {
      // En Tokio/Kiritimati ya sería jueves 23; en Caracas sigue siendo miércoles 22.
      expect(fechaLargaVE('2026-07-22T20:00:00.000Z')).toBe('miércoles 22 de julio')
      expect(fechaLargaVE('2026-07-18T02:00:00.000Z')).toBe('viernes 17 de julio')
    })
  })

  it('devuelve cadena vacía si no es un instante válido', () => {
    expect(fechaLargaVE('nunca')).toBe('')
  })
})

describe('hoyVE / mesActualVE', () => {
  it('resuelven el día y el mes de la operación en Caracas', () => {
    enCadaZonaHost(() => {
      expect(hoyVE(new Date('2026-07-18T02:00:00.000Z'))).toBe('2026-07-17')
      expect(hoyVE(new Date('2026-07-17T23:59:00.000Z'))).toBe('2026-07-17')
      expect(mesActualVE(new Date('2026-08-01T02:00:00.000Z'))).toBe('2026-07')
      expect(mesActualVE(new Date('2026-07-31T23:00:00.000Z'))).toBe('2026-07')
    })
  })

  it('sin argumento usan el instante actual y devuelven el formato esperado', () => {
    expect(hoyVE()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(mesActualVE()).toMatch(/^\d{4}-\d{2}$/)
    expect(mesActualVE()).toBe(hoyVE().slice(0, 7))
  })
})

describe('ZONA_VE', () => {
  it('es la zona IANA de Venezuela (nunca un offset fijo)', () => {
    expect(ZONA_VE).toBe('America/Caracas')
  })
})
