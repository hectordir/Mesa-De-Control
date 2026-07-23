import {
  construirGestionesDemo,
  entrelazar,
  GestionDemo,
  MOTIVOS,
  OperadorDemo,
} from './gestiones-demo';

const FECHA = '2026-07-22';

/** Mismo reparto que usa el seed: columnas 198/54/31/38/21, filas 78/66/59/71/68. */
const OPERADORES: OperadorDemo[] = [
  { id: 'demo', reparto: [0, 0, 0, 0, 0] },
  { id: 'op-jhon', reparto: [46, 12, 7, 9, 4] },
  { id: 'op-maria', reparto: [38, 10, 6, 8, 4] },
  { id: 'op-carlos', reparto: [33, 10, 6, 7, 3] },
  { id: 'op-ana', reparto: [41, 11, 6, 8, 5] },
  { id: 'op-luis', reparto: [40, 11, 6, 6, 5] },
];

const cuenta = <T, K extends string>(items: T[], key: (t: T) => K) =>
  items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

/** Las N más recientes, tal como las devolvería `orderBy createdAt desc`. */
const masRecientes = (gestiones: GestionDemo[], n: number) =>
  [...gestiones]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, n);

describe('entrelazar', () => {
  it('reparte cada grupo de forma uniforme, sin perder ni duplicar elementos', () => {
    const salida = entrelazar([
      ['a', 'a', 'a', 'a', 'a', 'a'],
      ['b', 'b', 'b'],
    ]);

    expect(salida).toHaveLength(9);
    expect(cuenta(salida, (s) => s)).toEqual({ a: 6, b: 3 });
    // El grupo pequeño no queda apelmazado al principio ni al final.
    expect(salida.slice(0, 3)).toContain('b');
    expect(salida.slice(-3)).toContain('b');
  });

  it('es determinista y tolera grupos vacíos', () => {
    expect(entrelazar([[], ['x'], []])).toEqual(['x']);
    expect(entrelazar([['a', 'b'], ['c']])).toEqual(
      entrelazar([['a', 'b'], ['c']]),
    );
  });
});

describe('construirGestionesDemo', () => {
  let gestiones: GestionDemo[];

  beforeEach(() => {
    gestiones = construirGestionesDemo(FECHA, OPERADORES);
  });

  it('genera las 342 gestiones del día con los totales del diseño', () => {
    expect(gestiones).toHaveLength(342);
    expect(cuenta(gestiones, (g) => g.resultado)).toEqual({
      SOLUCIONADO_MESA: 198,
      ENVIADO_SOPORTE2: 54,
      ESCALADO_NOC: 31,
      PENDIENTE_CLIENTE: 38,
      REAGENDADO: 21,
    });
  });

  it('conserva el reparto por operador y omite a quien no gestiona', () => {
    expect(cuenta(gestiones, (g) => g.operadorId)).toEqual({
      'op-jhon': 78,
      'op-maria': 66,
      'op-carlos': 59,
      'op-ana': 71,
      'op-luis': 68,
    });
  });

  it('conserva el conteo de motivos (top 5 del diseño incluido)', () => {
    expect(cuenta(gestiones, (g) => g.motivo)).toEqual(
      Object.fromEntries(MOTIVOS.map(([motivo, veces]) => [motivo, veces])),
    );
  });

  // Regresión: el seed agrupaba las gestiones por persona, así que las 20 más
  // recientes eran todas del último operador y el "Radar de Operaciones" salía
  // copado por uno solo.
  it('intercala operadores: las 20 más recientes involucran a varios', () => {
    const ultimas = masRecientes(gestiones, 20);
    const operadores = new Set(ultimas.map((g) => g.operadorId));

    expect(operadores.size).toBeGreaterThan(1);
    // Ningún operador domina la ventana: nadie pasa de la mitad.
    const maximo = Math.max(
      ...Object.values(cuenta(ultimas, (g) => g.operadorId)),
    );
    expect(maximo).toBeLessThanOrEqual(10);
  });

  it('la mezcla se sostiene en cualquier ventana reciente, no solo en 20', () => {
    for (const n of [10, 20, 50]) {
      const operadores = new Set(
        masRecientes(gestiones, n).map((g) => g.operadorId),
      );
      expect(operadores.size).toBeGreaterThan(1);
    }
  });

  it('también intercala resultados dentro de la ventana reciente', () => {
    const resultados = new Set(
      masRecientes(gestiones, 20).map((g) => g.resultado),
    );
    expect(resultados.size).toBeGreaterThan(1);
  });

  it('todas caen en el día pedido y con createdAt creciente y único', () => {
    const horas = gestiones.map((g) => g.createdAt.getTime());

    expect(new Set(horas).size).toBe(gestiones.length);
    expect([...horas].sort((a, b) => a - b)).toEqual(horas);
    for (const g of gestiones) {
      expect(g.fecha.toISOString()).toBe(`${FECHA}T00:00:00.000Z`);
      expect(g.createdAt.toISOString().slice(0, 10)).toBe(FECHA);
    }
  });

  it('es determinista: mismos ids y mismas horas en dos ejecuciones (idempotencia)', () => {
    const otra = construirGestionesDemo(FECHA, OPERADORES);

    expect(otra).toEqual(gestiones);
    expect(new Set(gestiones.map((g) => g.id)).size).toBe(gestiones.length);
    expect(gestiones[0].id).toBe(`seed-${FECHA}-0000`);
  });

  it('puebla canal y duracion de forma determinista y plausible', () => {
    const canales = new Set(gestiones.map((g) => g.canal));

    // Solo los tres canales del enum, y los tres presentes.
    expect([...canales].sort()).toEqual(['LLAMADA', 'TELEGRAM', 'WHATSAPP']);
    for (const g of gestiones) {
      expect(g.duracion).toBeGreaterThanOrEqual(2);
      expect(g.duracion).toBeLessThanOrEqual(30);
      expect(Number.isInteger(g.duracion)).toBe(true);
    }
  });
});
