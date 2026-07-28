import { construirAtenciones, sembrarAtenciones } from './atenciones';
import { diaLocal } from './dia';
import {
  CANALES,
  MOTIVOS,
  SOLUCIONES,
  origenDeMotivo,
} from '../fibex-play/gestion/catalogos';

/** Ids de operadores ya sembrados (los pasa el seed real buscándolos por email). */
const OPERADORES = ['op-1', 'op-2', 'op-3', 'op-4', 'op-5'];

describe('construirAtenciones', () => {
  const atenciones = construirAtenciones(OPERADORES);

  it('genera 24 atenciones con ids deterministas atencion-0001…', () => {
    expect(atenciones).toHaveLength(24);
    expect(atenciones[0].id).toBe('atencion-0001');
    expect(new Set(atenciones.map((a) => a.id)).size).toBe(24);
  });

  it('reparte los estados 16 SOLUCIONADO / 5 EN_PROCESO / 3 ESCALADO', () => {
    const cuenta = (estado: string) =>
      atenciones.filter((a) => a.estado === estado).length;
    expect(cuenta('SOLUCIONADO')).toBe(16);
    expect(cuenta('EN_PROCESO')).toBe(5);
    expect(cuenta('ESCALADO')).toBe(3);
  });

  it('pone ESPN como canal top del ranking descendente', () => {
    const porCanal = new Map<string, number>();
    for (const a of atenciones)
      porCanal.set(a.canal, (porCanal.get(a.canal) ?? 0) + 1);
    const ranking = [...porCanal.entries()].sort((x, y) => y[1] - x[1]);
    expect(ranking[0][0]).toBe('ESPN');
    expect(porCanal.get('Cartoon Network')!).toBeLessThanOrEqual(
      porCanal.get('ESPN')!,
    );
  });

  it('cubre las 4 categorías de origen (todas con ≥1)', () => {
    const origenes = new Set(atenciones.map((a) => origenDeMotivo(a.motivo)));
    expect(origenes).toEqual(
      new Set([
        'Señal / Transmisión',
        'App / Login',
        'Cuenta / Pago',
        'Dispositivo',
      ]),
    );
  });

  it('usa solo valores del catálogo y operadores provistos', () => {
    for (const a of atenciones) {
      expect(CANALES).toContain(a.canal);
      expect(MOTIVOS).toContain(a.motivo);
      expect(SOLUCIONES).toContain(a.solucion);
      expect(OPERADORES).toContain(a.operadorId);
    }
  });

  it('es reproducible para un mismo día y da 24 instantes distintos', () => {
    expect(construirAtenciones(OPERADORES)).toEqual(atenciones);
    for (const a of atenciones) expect(a.creadoEn).toBeInstanceOf(Date);
    // Fechas distintas → orden estable por creadoEn.
    const tiempos = atenciones.map((a) => a.creadoEn.getTime());
    expect(new Set(tiempos).size).toBe(24);
  });

  it('sitúa todas las atenciones en el día de HOY por defecto', () => {
    const hoy = diaLocal();
    for (const a of atenciones) {
      expect(diaLocal(a.creadoEn)).toBe(hoy);
    }
  });

  it('acepta un día base explícito y reparte por horas laborales', () => {
    const base = new Date(2026, 2, 5, 12, 0, 0);
    const filas = construirAtenciones(OPERADORES, base);
    for (const f of filas) expect(diaLocal(f.creadoEn)).toBe('2026-03-05');
    // Reparto en al menos 4 horas distintas del día (no todas al mismo minuto).
    const horas = new Set(filas.map((f) => f.creadoEn.getUTCHours()));
    expect(horas.size).toBeGreaterThanOrEqual(4);
    expect(filas[0].creadoEn.getTime()).toBeLessThan(
      filas[filas.length - 1].creadoEn.getTime(),
    );
  });
});

describe('sembrarAtenciones', () => {
  it('inserta con skipDuplicates y refresca creadoEn de las filas ya existentes', async () => {
    const updates: { id: string; creadoEn: Date }[] = [];
    const prisma = {
      atencionApp: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        updateMany: jest
          .fn()
          .mockImplementation(
            (args: { where: { id: string }; data: { creadoEn: Date } }) => {
              updates.push({ id: args.where.id, creadoEn: args.data.creadoEn });
              return Promise.resolve({ count: 1 });
            },
          ),
      },
    };

    const { count, actualizadas } = await sembrarAtenciones(prisma, OPERADORES);

    expect(count).toBe(0);
    expect(actualizadas).toBe(24);
    expect(updates).toHaveLength(24);
    const hoy = diaLocal();
    for (const u of updates) expect(diaLocal(u.creadoEn)).toBe(hoy);
  });
});
