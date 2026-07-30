import { diaLocal } from './dia';
import { hoyVE } from '../common/time/index';
import { sinHoraLocal } from '../common/time/sin-hora-local';

describe('diaLocal', () => {
  it('devuelve YYYY-MM-DD en hora de Caracas', () => {
    expect(diaLocal(new Date('2026-03-05T16:00:00.000Z'))).toBe('2026-03-05');
  });

  it('rellena mes y día a dos dígitos', () => {
    expect(diaLocal(new Date('2026-01-09T16:00:00.000Z'))).toBe('2026-01-09');
  });

  it('la franja 00:00–04:00 UTC pertenece al día anterior en Caracas', () => {
    expect(diaLocal(new Date('2026-03-05T02:30:00.000Z'))).toBe('2026-03-04');
    expect(diaLocal(new Date('2026-03-05T04:00:00.000Z'))).toBe('2026-03-05');
  });

  it('no depende de la hora local del proceso', async () => {
    await sinHoraLocal(() => {
      expect(diaLocal(new Date('2026-03-05T02:30:00.000Z'))).toBe('2026-03-04');
    });
  });

  it('sin argumento usa la fecha actual del sistema', () => {
    expect(diaLocal()).toBe(hoyVE());
  });

  it('coincide con el `hoy` que usan los dashboards', () => {
    const d = new Date('2026-07-18T02:30:00.000Z');
    expect(diaLocal(d)).toBe(hoyVE(d));
  });
});
