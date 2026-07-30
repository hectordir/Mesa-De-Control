import {
  ZONA_VE,
  formatFechaVE,
  formatHora12VE,
  formatHoraVE,
  hoyVE,
  mesActualVE,
} from './hora-ve';

describe('helper de hora venezolana', () => {
  it('declara la zona IANA de Venezuela', () => {
    expect(ZONA_VE).toBe('America/Caracas');
  });

  describe('formatHoraVE (24h)', () => {
    it.each([
      ['2026-07-22T12:00:00.000Z', '08:00'],
      ['2026-07-17T14:42:00.000Z', '10:42'],
      ['2026-07-22T10:51:00.000Z', '06:51'],
      ['2026-07-22T23:59:00.000Z', '19:59'],
      // Medianoche UTC ⇒ 20:00 del día anterior en Caracas.
      ['2026-07-18T00:00:00.000Z', '20:00'],
    ])('%s ⇒ %s', (iso, esperado) => {
      expect(formatHoraVE(new Date(iso))).toBe(esperado);
    });

    it('rellena la hora a dos dígitos', () => {
      expect(formatHoraVE(new Date('2026-07-22T04:05:00.000Z'))).toBe('00:05');
    });
  });

  describe('formatHora12VE', () => {
    it.each([
      ['2026-07-17T14:42:00.000Z', '10:42 a. m.'],
      ['2026-07-18T11:47:00.000Z', '7:47 a. m.'],
      // 04:00 UTC = medianoche exacta en Caracas ⇒ 12 a. m.
      ['2026-01-05T04:00:00.000Z', '12:00 a. m.'],
      // 16:00 UTC = mediodía exacto en Caracas ⇒ 12 p. m.
      ['2026-01-05T16:00:00.000Z', '12:00 p. m.'],
      ['2026-01-05T23:59:00.000Z', '7:59 p. m.'],
      ['2026-01-05T03:59:00.000Z', '11:59 p. m.'],
    ])('%s ⇒ %s', (iso, esperado) => {
      expect(formatHora12VE(new Date(iso))).toBe(esperado);
    });
  });

  describe('formatFechaVE (DD/MM/YYYY)', () => {
    it('formatea el día en Caracas', () => {
      expect(formatFechaVE(new Date('2026-07-18T11:47:00.000Z'))).toBe(
        '18/07/2026',
      );
    });

    it('rellena día y mes a dos dígitos', () => {
      expect(formatFechaVE(new Date('2026-01-09T15:00:00.000Z'))).toBe(
        '09/01/2026',
      );
    });
  });

  describe('franja 00:00–04:00 UTC (día anterior en Caracas)', () => {
    it.each([
      '2026-07-18T00:00:00.000Z',
      '2026-07-18T02:30:00.000Z',
      '2026-07-18T03:59:59.000Z',
    ])('%s pertenece al 17/07/2026 en Caracas', (iso) => {
      expect(formatFechaVE(new Date(iso))).toBe('17/07/2026');
      expect(hoyVE(new Date(iso))).toBe('2026-07-17');
    });

    it('04:00:00 UTC ya es el día nuevo en Caracas', () => {
      const d = new Date('2026-07-18T04:00:00.000Z');
      expect(formatFechaVE(d)).toBe('18/07/2026');
      expect(hoyVE(d)).toBe('2026-07-18');
      expect(formatHoraVE(d)).toBe('00:00');
    });
  });

  describe('offset histórico −04:30 (2007–2016)', () => {
    // Una resta fija de 4 horas daría 08:00 y 2015-01-01: ambos incorrectos.
    it('2015-06-15T12:00:00Z ⇒ 07:30 en Caracas', () => {
      const d = new Date('2015-06-15T12:00:00.000Z');
      expect(formatHoraVE(d)).toBe('07:30');
      expect(formatHora12VE(d)).toBe('7:30 a. m.');
      expect(formatFechaVE(d)).toBe('15/06/2015');
    });

    it('2015-01-01T04:15:00Z todavía es 31/12/2014 en Caracas', () => {
      const d = new Date('2015-01-01T04:15:00.000Z');
      expect(formatHoraVE(d)).toBe('23:45');
      expect(formatFechaVE(d)).toBe('31/12/2014');
      expect(hoyVE(d)).toBe('2014-12-31');
      expect(mesActualVE(d)).toBe('2014-12');
    });
  });

  describe('hoyVE / mesActualVE', () => {
    it('devuelve YYYY-MM-DD y YYYY-MM', () => {
      const d = new Date('2026-03-05T16:00:00.000Z');
      expect(hoyVE(d)).toBe('2026-03-05');
      expect(mesActualVE(d)).toBe('2026-03');
    });

    it('el cambio de mes ocurre a las 04:00 UTC', () => {
      expect(mesActualVE(new Date('2026-08-01T03:00:00.000Z'))).toBe('2026-07');
      expect(mesActualVE(new Date('2026-08-01T04:00:00.000Z'))).toBe('2026-08');
    });

    it('sin argumento usan el instante actual', () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-07-18T02:30:00.000Z'));
      try {
        expect(hoyVE()).toBe('2026-07-17');
        expect(mesActualVE()).toBe('2026-07');
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('independencia de la zona del proceso', () => {
    it('no depende de getHours/getMonth del host', () => {
      const original = process.env.TZ;
      const d = new Date('2026-07-22T12:00:00.000Z');
      try {
        process.env.TZ = 'UTC';
        expect(formatHoraVE(d)).toBe('08:00');
        process.env.TZ = 'Asia/Tokyo';
        expect(formatHoraVE(d)).toBe('08:00');
      } finally {
        process.env.TZ = original;
      }
    });
  });
});
