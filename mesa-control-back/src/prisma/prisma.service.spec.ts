import { pgAdapterOptions } from './prisma-connection';

describe('pgAdapterOptions', () => {
  it('no pasa SSL cuando la URL no lo pide (Postgres local de docker-compose)', () => {
    const url =
      'postgresql://mesa:mesa@localhost:5432/mesa_control?schema=public';

    expect(pgAdapterOptions(url)).toEqual({ connectionString: url });
  });

  it('no pasa SSL con sslmode=disable', () => {
    const url =
      'postgresql://mesa:mesa@localhost:5432/mesa_control?sslmode=disable';

    expect(pgAdapterOptions(url)).toEqual({ connectionString: url });
  });

  it('activa SSL sin verificar el certificado con sslmode=require (Railway)', () => {
    const url =
      'postgresql://u:p@host.proxy.rlwy.net:5432/railway?sslmode=require';

    expect(pgAdapterOptions(url)).toEqual({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('verifica el certificado con sslmode=verify-full', () => {
    const url = 'postgresql://u:p@host:5432/db?sslmode=verify-full';

    expect(pgAdapterOptions(url)).toEqual({
      connectionString: url,
      ssl: { rejectUnauthorized: true },
    });
  });

  it('falla con mensaje claro si no hay connection string', () => {
    expect(() => pgAdapterOptions(undefined)).toThrow(/DATABASE_URL/);
  });
});
