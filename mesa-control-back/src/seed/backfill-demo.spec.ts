import { DETALLES, OBSERVACIONES, SOLUCIONES, TIPOS } from './gestiones-demo';
import {
  abonadoDeId,
  atencionDeId,
  esIdDemo,
  FilaDemo,
  planBackfillDemo,
} from './backfill-demo';

const ABONADO_RE = /^\d{7}$/;

/** Fila tal como sale de la BD, con los defaults '' del schema. */
const fila = (over: Partial<FilaDemo> & { id: string }): FilaDemo => ({
  abonado: '',
  detalle: '',
  solucion: '',
  tipo: '',
  observacion: '',
  ...over,
});

/** Aplica el plan sobre una "BD" en memoria, como haría el `updateMany`. */
const aplicar = (
  filas: FilaDemo[],
  plan: ReturnType<typeof planBackfillDemo>,
) =>
  filas.map((f) => {
    const parche = plan.find((p) => p.id === f.id);
    return parche ? { ...f, ...parche.datos } : f;
  });

describe('esIdDemo', () => {
  it('reconoce los cuatro prefijos del seed y descarta el resto', () => {
    for (const id of [
      'seed-2026-07-22-0001',
      'sup-2026-07-22-d0-z1-03',
      'mensual-2026-05-0123',
      'enero-2026-01-15-007',
    ]) {
      expect(esIdDemo(id)).toBe(true);
    }
    // Gestión creada por el POST (uuid): jamás se toca.
    expect(esIdDemo('3f2a1c9e-0b7d-4a11-9d3e-77c9a1b2c3d4')).toBe(false);
  });
});

describe('abonadoDeId / atencionDeId', () => {
  it('derivan valores deterministas del id, dentro de catálogo', () => {
    const id = 'seed-2026-07-20-0123';

    expect(abonadoDeId(id)).toMatch(ABONADO_RE);
    expect(abonadoDeId(id)).toBe(abonadoDeId(id));
    expect(abonadoDeId(id)).not.toBe(abonadoDeId('seed-2026-07-20-0124'));

    const a = atencionDeId(id);
    expect(DETALLES).toContain(a.detalle);
    expect(SOLUCIONES).toContain(a.solucion);
    expect(TIPOS).toContain(a.tipo);
    expect(OBSERVACIONES).toContain(a.observacion);
    expect(atencionDeId(id)).toEqual(a);
  });
});

describe('planBackfillDemo', () => {
  const generadas: FilaDemo[] = [
    {
      id: 'seed-2026-07-22-0000',
      abonado: '1004871',
      detalle: 'Falla LOS',
      solucion: 'Reinicio de ONU',
      tipo: 'Mesa',
      observacion: 'Atención cerrada en primera llamada.',
    },
  ];

  it('reasigna el abonado con forma de zona de las filas demo', () => {
    const bd = [
      fila({
        id: 'seed-2026-07-22-0000',
        abonado: 'Cond. Los Robles · Casa 01',
      }),
      // Día anterior: ningún builder vigente la regenera.
      fila({ id: 'seed-2026-07-20-0100', abonado: 'Torre Aurora · Casa 12' }),
      fila({ id: 'mensual-2026-05-0007', abonado: 'Macuto · Casa 08' }),
    ];

    const plan = planBackfillDemo(bd, generadas);

    expect(plan).toHaveLength(3);
    // La fila regenerada toma el valor del builder; el resto, el derivado del id.
    expect(plan[0].datos.abonado).toBe('1004871');
    for (const p of plan) expect(p.datos.abonado).toMatch(ABONADO_RE);
  });

  it('no toca gestiones ajenas al seed aunque tengan campos vacíos', () => {
    const bd = [fila({ id: '3f2a1c9e-0b7d-4a11-9d3e-77c9a1b2c3d4' })];

    expect(planBackfillDemo(bd, [])).toEqual([]);
  });

  it('rellena detalle/solucion/tipo/observacion solo si están vacíos', () => {
    const bd = [
      fila({
        id: 'seed-2026-07-20-0100',
        abonado: abonadoDeId('seed-2026-07-20-0100'),
        detalle: 'Motivo histórico fuera de catálogo',
        solucion: '',
        tipo: 'NOC',
        observacion: '',
      }),
    ];

    const [parche] = planBackfillDemo(bd, []);

    expect(parche.datos.detalle).toBeUndefined();
    expect(parche.datos.tipo).toBeUndefined();
    expect(parche.datos.abonado).toBeUndefined();
    expect(SOLUCIONES).toContain(parche.datos.solucion);
    expect(OBSERVACIONES).toContain(parche.datos.observacion);
  });

  it('es convergente: la segunda pasada no cambia nada', () => {
    const bd = [
      fila({
        id: 'seed-2026-07-22-0000',
        abonado: 'Cond. Los Robles · Casa 01',
      }),
      fila({ id: 'sup-2026-07-19-d1-z2-00', abonado: 'Abonado Macuto #01' }),
      fila({ id: 'enero-2026-01-15-007', abonado: 'Canaima · Casa 03' }),
      fila({ id: '3f2a1c9e-0b7d-4a11-9d3e-77c9a1b2c3d4' }),
    ];

    const primera = aplicar(bd, planBackfillDemo(bd, generadas));

    expect(planBackfillDemo(primera, generadas)).toEqual([]);
    // Y ninguna fila demo queda con hueco.
    for (const f of primera.filter((x) => esIdDemo(x.id))) {
      expect(f.abonado).toMatch(ABONADO_RE);
      expect(f.detalle).not.toBe('');
      expect(f.solucion).not.toBe('');
      expect(f.tipo).not.toBe('');
      expect(f.observacion).not.toBe('');
    }
  });
});
