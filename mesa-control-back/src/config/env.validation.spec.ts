import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const valid = { JWT_SECRET: 's3cr3t', DATABASE_URL: 'postgresql://x' };

  it('devuelve la config cuando están todas las variables obligatorias', () => {
    expect(validateEnv({ ...valid })).toMatchObject(valid);
  });

  it('lanza si falta JWT_SECRET', () => {
    expect(() => validateEnv({ DATABASE_URL: 'postgresql://x' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('lanza si JWT_SECRET está vacío', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: '   ' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('lanza si falta DATABASE_URL', () => {
    expect(() => validateEnv({ JWT_SECRET: 's3cr3t' })).toThrow(/DATABASE_URL/);
  });
});
