import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  abonadoPorIndice,
  atencionPorIndice,
  construirGestionesDemo,
  DETALLES,
  entrelazar,
  GestionDemo,
  MOTIVOS,
  nombreClientePorIndice,
  OBSERVACIONES,
  OperadorDemo,
  SOLUCIONES,
  telefonoPorIndice,
  TIPOS,
} from './gestiones-demo';

/** Formato venezolano `04XX-XXX-XXXX` con los 5 prefijos móviles vigentes. */
const TELEFONO_RE = /^04(12|14|16|24|26)-\d{3}-\d{4}$/;

/** Identificador de abonado en Fibex: numérico de 7 dígitos. */
const ABONADO_RE = /^\d{7}$/;

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

  it('puebla nombreCliente con nombres plausibles y deterministas', () => {
    for (const g of gestiones) {
      expect(g.nombreCliente.length).toBeGreaterThan(0);
      expect(g.nombreCliente.length).toBeLessThanOrEqual(120);
      // Nombre y apellido, sin dígitos.
      expect(g.nombreCliente).toMatch(/^\S+ \S+$/u);
    }
    // Variedad: no todas las gestiones del día son el mismo cliente.
    expect(new Set(gestiones.map((g) => g.nombreCliente)).size).toBeGreaterThan(
      10,
    );
    expect(nombreClientePorIndice(7)).toBe(nombreClientePorIndice(7));
  });

  it('puebla telefono con formato 04XX-XXX-XXXX determinista', () => {
    for (const g of gestiones) expect(g.telefono).toMatch(TELEFONO_RE);
    // Variedad: no todas las gestiones del día comparten teléfono.
    expect(new Set(gestiones.map((g) => g.telefono)).size).toBeGreaterThan(10);
    // Determinista: misma posición, mismo número (idempotencia del seed).
    expect(telefonoPorIndice(7)).toBe(telefonoPorIndice(7));
    expect(telefonoPorIndice(7)).not.toBe(telefonoPorIndice(8));
    // Los 5 prefijos móviles aparecen en la jornada.
    expect(new Set(gestiones.map((g) => g.telefono.slice(0, 4))).size).toBe(5);
  });

  it('puebla abonado con el identificador Fibex, nunca con la zona', () => {
    for (const g of gestiones) {
      expect(g.abonado).toMatch(ABONADO_RE);
      // Regresión: el seed escribía la zona (`Cond. Los Robles · Casa 07`).
      expect(g.abonado).not.toContain(g.ubicacion);
    }
    // Un identificador distinto por gestión del día.
    expect(new Set(gestiones.map((g) => g.abonado)).size).toBe(
      gestiones.length,
    );
  });

  it('puebla detalle, solucion y tipo con valores del catálogo del front', () => {
    for (const g of gestiones) {
      expect(DETALLES).toContain(g.detalle);
      expect(SOLUCIONES).toContain(g.solucion);
      expect(TIPOS).toContain(g.tipo);
      expect(g.observacion.length).toBeGreaterThan(0);
    }
    // Variedad: los tres catálogos aparecen completos en una jornada de 342.
    expect(new Set(gestiones.map((g) => g.detalle)).size).toBe(DETALLES.length);
    expect(new Set(gestiones.map((g) => g.solucion)).size).toBe(
      SOLUCIONES.length,
    );
    expect(new Set(gestiones.map((g) => g.tipo)).size).toBe(TIPOS.length);
    expect(new Set(gestiones.map((g) => g.observacion)).size).toBe(
      OBSERVACIONES.length,
    );
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

describe('abonadoPorIndice', () => {
  it('genera identificadores Fibex de 7 dígitos', () => {
    for (const i of [0, 1, 7, 341, 1000, 8768]) {
      expect(abonadoPorIndice(i)).toMatch(ABONADO_RE);
    }
  });

  it('es determinista: misma posición, mismo identificador', () => {
    expect(abonadoPorIndice(7)).toBe(abonadoPorIndice(7));
    expect(abonadoPorIndice(7)).not.toBe(abonadoPorIndice(8));
  });

  it('no repite identificador en un rango amplio de índices', () => {
    const ids = Array.from({ length: 10_000 }, (_, i) => abonadoPorIndice(i));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('atencionPorIndice', () => {
  it('devuelve siempre valores de los catálogos y observación no vacía', () => {
    for (let i = 0; i < 200; i += 1) {
      const a = atencionPorIndice(i);
      expect(DETALLES).toContain(a.detalle);
      expect(SOLUCIONES).toContain(a.solucion);
      expect(TIPOS).toContain(a.tipo);
      expect(OBSERVACIONES).toContain(a.observacion);
    }
  });

  it('es determinista y varía la combinación con el índice', () => {
    expect(atencionPorIndice(3)).toEqual(atencionPorIndice(3));
    expect(atencionPorIndice(3)).not.toEqual(atencionPorIndice(4));
  });
});

/**
 * Los selects del front son cerrados: si el seed escribe un valor fuera de su
 * catálogo, el modal de edición lo muestra en blanco. Este test lee el catálogo
 * real del front (no una copia) para que la divergencia salga en rojo aquí.
 */
describe('catálogos del seed vs. catálogos del front', () => {
  const fuente = readFileSync(
    join(
      __dirname,
      '../../../mesa-control-front/src/features/registro/opciones.ts',
    ),
    'utf8',
  );

  const catalogoFront = (nombre: string): string[] => {
    const bloque = new RegExp(`${nombre} = texto\\(\\[([\\s\\S]*?)\\]\\)`).exec(
      fuente,
    );
    expect(bloque).not.toBeNull();
    return [...bloque![1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
  };

  it.each([
    ['DETALLE_OPCIONES', DETALLES],
    ['SOLUCION_OPCIONES', SOLUCIONES],
    ['TIPO_OPCIONES', TIPOS],
  ])('%s coincide exactamente con el catálogo del seed', (nombre, seed) => {
    expect(catalogoFront(nombre)).toEqual([...(seed as string[])]);
  });
});
