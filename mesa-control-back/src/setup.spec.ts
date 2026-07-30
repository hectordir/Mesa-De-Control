import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';

import { configureApp, isOriginAllowed, isSwaggerEnabled } from './setup';

describe('isOriginAllowed', () => {
  it('permite el origen por defecto de desarrollo cuando CORS_ORIGIN no está definido', () => {
    expect(isOriginAllowed('http://localhost:5173', {})).toBe(true);
    expect(isOriginAllowed('http://localhost:4173', {})).toBe(false);
  });

  it('admite una lista separada por comas y normaliza los espacios', () => {
    const env = {
      CORS_ORIGIN: ' https://mesa.vercel.app , http://localhost:5173 ',
    };

    expect(isOriginAllowed('https://mesa.vercel.app', env)).toBe(true);
    expect(isOriginAllowed('http://localhost:5173', env)).toBe(true);
    expect(isOriginAllowed('https://otro.com', env)).toBe(false);
  });

  it('permite peticiones sin header Origin (curl, healthcheck del balanceador)', () => {
    expect(
      isOriginAllowed(undefined, { CORS_ORIGIN: 'https://mesa.app' }),
    ).toBe(true);
    expect(isOriginAllowed('', { CORS_ORIGIN: 'https://mesa.app' })).toBe(true);
  });

  it('acepta previews *.vercel.app solo con CORS_ALLOW_VERCEL_PREVIEWS activo', () => {
    const sinFlag = { CORS_ORIGIN: 'https://mesa.vercel.app' };
    const conFlag = { ...sinFlag, CORS_ALLOW_VERCEL_PREVIEWS: 'true' };

    expect(
      isOriginAllowed('https://mesa-git-abc-team.vercel.app', sinFlag),
    ).toBe(false);
    expect(
      isOriginAllowed('https://mesa-git-abc-team.vercel.app', conFlag),
    ).toBe(true);
  });

  it('rechaza dominios ajenos aunque los previews estén activos', () => {
    const env = {
      CORS_ORIGIN: 'https://mesa.vercel.app',
      CORS_ALLOW_VERCEL_PREVIEWS: 'true',
    };

    expect(isOriginAllowed('https://evil.com', env)).toBe(false);
    expect(isOriginAllowed('https://evil.vercel.app.evil.com', env)).toBe(
      false,
    );
    expect(isOriginAllowed('http://mesa.vercel.app', env)).toBe(false);
  });
});

describe('isSwaggerEnabled', () => {
  it('está desactivado solo en producción', () => {
    expect(isSwaggerEnabled('production')).toBe(false);
    expect(isSwaggerEnabled('development')).toBe(true);
    expect(isSwaggerEnabled('test')).toBe(true);
    expect(isSwaggerEnabled(undefined)).toBe(true);
  });
});

describe('configureApp', () => {
  const nodeEnvOriginal = process.env.NODE_ENV;
  let setupSpy: jest.SpyInstance;
  let app: INestApplication;

  beforeEach(() => {
    jest
      .spyOn(SwaggerModule, 'createDocument')
      .mockReturnValue({} as ReturnType<typeof SwaggerModule.createDocument>);
    setupSpy = jest.spyOn(SwaggerModule, 'setup').mockImplementation();

    app = {
      useGlobalPipes: jest.fn(),
      enableCors: jest.fn(),
    } as unknown as INestApplication;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = nodeEnvOriginal;
  });

  it('monta Swagger fuera de producción', () => {
    process.env.NODE_ENV = 'test';

    configureApp(app);

    expect(setupSpy).toHaveBeenCalledWith('api/docs', app, expect.anything());
  });

  it('no monta Swagger cuando NODE_ENV es production', () => {
    process.env.NODE_ENV = 'production';

    configureApp(app);

    expect(setupSpy).not.toHaveBeenCalled();
  });

  it('delega la decisión de CORS en isOriginAllowed', () => {
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = 'https://mesa.vercel.app';

    configureApp(app);

    const llamadas = (app.enableCors as jest.Mock).mock.calls as [
      {
        credentials: boolean;
        origin: (
          origin: string | undefined,
          cb: (err: Error | null, allow?: boolean) => void,
        ) => void;
      },
    ][];
    const options = llamadas[0][0];
    expect(options.credentials).toBe(true);

    const permitido = jest.fn();
    options.origin('https://mesa.vercel.app', permitido);
    expect(permitido).toHaveBeenCalledWith(null, true);

    const rechazado = jest.fn();
    options.origin('https://evil.com', rechazado);
    expect(rechazado).toHaveBeenCalledWith(null, false);

    delete process.env.CORS_ORIGIN;
  });
});
