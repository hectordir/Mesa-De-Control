import { diaLocal } from './dia';

describe('diaLocal', () => {
  it('devuelve YYYY-MM-DD en la zona del servidor', () => {
    // Mediodía local: el día es el mismo en cualquier zona horaria razonable.
    const d = new Date(2026, 2, 5, 12, 0, 0);
    expect(diaLocal(d)).toBe('2026-03-05');
  });

  it('rellena mes y día a dos dígitos', () => {
    expect(diaLocal(new Date(2026, 0, 9, 12, 0, 0))).toBe('2026-01-09');
  });

  it('sin argumento usa la fecha actual del sistema', () => {
    const now = new Date();
    const esperado = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    expect(diaLocal()).toBe(esperado);
  });
});
