import { MOTIVOS } from './gestiones-demo';
import {
  construirGestionesMensuales,
  construirMesDemo,
  MesDemo,
  mesesAnalisis,
  MOTIVOS_HEATMAP,
  ZONAS,
} from './gestiones-mensuales';

const OPERADORES = ['op-jhon', 'op-maria', 'op-carlos', 'op-ana', 'op-luis'];

const cuenta = <T>(items: T[], key: (t: T) => string) =>
  items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

describe('mesesAnalisis', () => {
  it('devuelve los 4 meses cerrados más el mes en curso, en orden cronológico', () => {
    const meses = mesesAnalisis(new Date('2026-07-22T10:00:00.000Z'));

    expect(meses.map((m) => m.periodo)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
    ]);
  });

  it('cruza el año hacia atrás sin fechas fijas', () => {
    const meses = mesesAnalisis(new Date('2027-02-03T10:00:00.000Z'));

    expect(meses.map((m) => m.periodo)).toEqual([
      '2026-10',
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ]);
  });

  it('los meses cerrados tienen volumen alto y cubren el mes completo', () => {
    const meses = mesesAnalisis(new Date('2026-07-22T10:00:00.000Z'));
    const cerrados = meses.slice(0, 4);

    for (const mes of cerrados) {
      expect(mes.volumen).toBeGreaterThanOrEqual(1200);
      expect(mes.volumen).toBeLessThanOrEqual(1700);
      expect(mes.efectividad).toBeGreaterThanOrEqual(0.4);
      expect(mes.efectividad).toBeLessThanOrEqual(0.75);
    }
    // Marzo y mayo tienen 31 días; abril y junio, 30.
    expect(cerrados.map((m) => m.diaMaximo)).toEqual([31, 30, 31, 30]);
  });

  it('los meses cerrados muestran los dos estados del KPI frente a la meta del 65 %', () => {
    const cerrados = mesesAnalisis(new Date('2026-07-22T10:00:00.000Z')).slice(
      0,
      4,
    );
    const META = 0.65;

    expect(cerrados.some((m) => m.efectividad > META)).toBe(true);
    expect(cerrados.some((m) => m.efectividad < META)).toBe(true);
    // Variación realista: ningún par de meses con la misma efectividad.
    expect(new Set(cerrados.map((m) => m.efectividad)).size).toBe(4);
  });

  it('el mes en curso es parcial y se detiene antes de hoy (el día lo siembra el seed diario)', () => {
    const [enCurso] = mesesAnalisis(new Date('2026-07-22T10:00:00.000Z')).slice(
      -1,
    );

    expect(enCurso.periodo).toBe('2026-07');
    expect(enCurso.volumen).toBeGreaterThanOrEqual(400);
    expect(enCurso.volumen).toBeLessThanOrEqual(500);
    expect(enCurso.diaMaximo).toBe(21);
  });

  it('el día 1 del mes no genera gestiones para el mes en curso', () => {
    const [enCurso] = mesesAnalisis(new Date('2026-07-01T10:00:00.000Z')).slice(
      -1,
    );

    expect(enCurso.volumen).toBe(0);
  });
});

describe('construirMesDemo', () => {
  const MES: MesDemo = {
    periodo: '2026-05',
    volumen: 1400,
    efectividad: 0.43,
    diaMaximo: 31,
  };
  let gestiones: ReturnType<typeof construirMesDemo>;

  beforeEach(() => {
    gestiones = construirMesDemo(MES, OPERADORES);
  });

  it('genera exactamente el volumen pedido con ids deterministas y únicos', () => {
    expect(gestiones).toHaveLength(1400);
    expect(new Set(gestiones.map((g) => g.id)).size).toBe(1400);
    expect(gestiones[0].id).toBe('mensual-2026-05-0000');
  });

  it('es determinista: dos ejecuciones producen exactamente lo mismo', () => {
    expect(construirMesDemo(MES, OPERADORES)).toEqual(gestiones);
  });

  it('cambia la distribución de un mes a otro (semilla derivada del periodo)', () => {
    const otro = construirMesDemo({ ...MES, periodo: '2026-06' }, OPERADORES);

    expect(otro.map((g) => g.ubicacion)).not.toEqual(
      gestiones.map((g) => g.ubicacion),
    );
  });

  it('respeta la efectividad pedida (SOLUCIONADO_MESA / total)', () => {
    const mesa = gestiones.filter(
      (g) => g.resultado === 'SOLUCIONADO_MESA',
    ).length;

    expect(mesa / gestiones.length).toBeCloseTo(0.43, 2);
  });

  it('usa los 5 resultados y reparte entre todos los operadores', () => {
    expect(Object.keys(cuenta(gestiones, (g) => g.resultado)).sort()).toEqual([
      'ENVIADO_SOPORTE2',
      'ESCALADO_NOC',
      'PENDIENTE_CLIENTE',
      'REAGENDADO',
      'SOLUCIONADO_MESA',
    ]);
    expect(Object.keys(cuenta(gestiones, (g) => g.operadorId)).sort()).toEqual(
      [...OPERADORES].sort(),
    );
  });

  it('todas caen dentro del mes y sin pasar del día máximo', () => {
    for (const g of gestiones) {
      expect(g.fecha.toISOString().slice(0, 7)).toBe('2026-05');
      expect(Number(g.fecha.toISOString().slice(8, 10))).toBeLessThanOrEqual(
        31,
      );
      expect(g.createdAt.toISOString().slice(0, 10)).toBe(
        g.fecha.toISOString().slice(0, 10),
      );
    }
  });

  it('cubre las 21 zonas del diseño y ninguna fuera de la lista', () => {
    const zonas = new Set(gestiones.map((g) => g.ubicacion));

    expect(ZONAS).toHaveLength(21);
    expect([...zonas].every((z) => ZONAS.includes(z))).toBe(true);
    expect(zonas.size).toBeGreaterThanOrEqual(15);
  });

  it('los 6 motivos más frecuentes son los del heatmap del diseño', () => {
    const top6 = Object.entries(cuenta(gestiones, (g) => g.motivo))
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([motivo]) => motivo);

    expect([...top6].sort()).toEqual([...MOTIVOS_HEATMAP].sort());
  });

  it('también usa los motivos del monitor diario como cola', () => {
    const usados = new Set(gestiones.map((g) => g.motivo));
    const cola = MOTIVOS.map(([motivo]) => motivo);

    expect(cola.some((motivo) => usados.has(motivo))).toBe(true);
  });

  it('el reparto zona × motivo no es uniforme y deja celdas en 0', () => {
    const celdas = new Map<string, number>();
    for (const g of gestiones) {
      if (!MOTIVOS_HEATMAP.includes(g.motivo)) continue;
      const clave = `${g.ubicacion}|${g.motivo}`;
      celdas.set(clave, (celdas.get(clave) ?? 0) + 1);
    }

    // 21 zonas × 6 motivos = 126 celdas posibles; bastantes deben quedar vacías.
    expect(celdas.size).toBeLessThan(126 * 0.8);
    const valores = [...celdas.values()];
    expect(Math.max(...valores)).toBeGreaterThan(3 * Math.min(...valores));
  });

  it('un mes de volumen 0 no genera gestiones', () => {
    expect(construirMesDemo({ ...MES, volumen: 0 }, OPERADORES)).toEqual([]);
  });
});

describe('construirGestionesMensuales', () => {
  it('concatena los 5 meses relativos a hoy sin colisión de ids', () => {
    const hoy = new Date('2026-07-22T10:00:00.000Z');
    const gestiones = construirGestionesMensuales(hoy, OPERADORES);
    const periodos = new Set(
      gestiones.map((g) => g.fecha.toISOString().slice(0, 7)),
    );

    expect(periodos.size).toBe(5);
    expect(new Set(gestiones.map((g) => g.id)).size).toBe(gestiones.length);
    expect(gestiones.length).toBeGreaterThan(5000);
  });

  it('no invade el día de hoy: eso es territorio del seed diario', () => {
    const hoy = new Date('2026-07-22T10:00:00.000Z');
    const gestiones = construirGestionesMensuales(hoy, OPERADORES);

    expect(
      gestiones.some(
        (g) => g.fecha.toISOString().slice(0, 10) === '2026-07-22',
      ),
    ).toBe(false);
  });
});
