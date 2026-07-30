import { DETALLES, OBSERVACIONES, SOLUCIONES, TIPOS } from './gestiones-demo';
import { construirSupervisionDemo, ZONAS_GUAIRA } from './supervision-demo';

/** Formato venezolano `04XX-XXX-XXXX` con los 5 prefijos móviles vigentes. */
const TELEFONO_RE = /^04(12|14|16|24|26)-\d{3}-\d{4}$/;

const FECHA = '2026-07-22';
const OPERADORES = ['op-1', 'op-2', 'op-3'];
const efectiva = new Date(`${FECHA}T00:00:00.000Z`);
const diasDesde = (fecha: Date) =>
  Math.round((efectiva.getTime() - fecha.getTime()) / 86_400_000);

describe('construirSupervisionDemo', () => {
  const filas = construirSupervisionDemo(FECHA, OPERADORES);

  it('cubre las 10 zonas de La Guaira en el día de hoy', () => {
    const zonasHoy = new Set(
      filas
        .filter((f) => f.fecha.getTime() === efectiva.getTime())
        .map((f) => f.ubicacion),
    );
    for (const z of ZONAS_GUAIRA) expect(zonasHoy.has(z)).toBe(true);
    expect(ZONAS_GUAIRA).toHaveLength(10);
  });

  it('incluye escaladas abiertas (N2/NOC) de antigüedades 0–5 días', () => {
    const abiertas = filas.filter(
      (f) =>
        f.resultado === 'ENVIADO_SOPORTE2' || f.resultado === 'ESCALADO_NOC',
    );
    const edades = new Set(abiertas.map((f) => diasDesde(f.fecha)));
    for (const d of [0, 1, 2, 3, 4, 5]) expect(edades.has(d)).toBe(true);
  });

  it('todas las filas tienen abonado no vacío y motivo', () => {
    for (const f of filas) {
      expect(f.abonado.length).toBeGreaterThan(0);
      expect(f.motivo.length).toBeGreaterThan(0);
    }
  });

  it('es determinista: ids estables al reconstruir', () => {
    const otra = construirSupervisionDemo(FECHA, OPERADORES);
    expect(otra.map((f) => f.id)).toEqual(filas.map((f) => f.id));
    expect(new Set(filas.map((f) => f.id)).size).toBe(filas.length);
  });

  it('pobla canal y duración en todas las filas (filtros del Historial)', () => {
    for (const f of filas) {
      expect(['LLAMADA', 'WHATSAPP', 'TELEGRAM']).toContain(f.canal);
      expect(f.duracion).toBeGreaterThanOrEqual(2);
      expect(f.duracion).toBeLessThanOrEqual(30);
    }
    // Los tres canales aparecen: ningún filtro del Historial queda en cero.
    expect(new Set(filas.map((f) => f.canal)).size).toBe(3);
  });

  it('reparte el operador entre los provistos', () => {
    const usados = new Set(filas.map((f) => f.operadorId));
    for (const op of OPERADORES) expect(usados.has(op)).toBe(true);
  });

  it('pobla nombreCliente en todas las filas', () => {
    for (const f of filas) {
      expect(f.nombreCliente).toMatch(/^\S+ \S+$/u);
      expect(f.nombreCliente.length).toBeLessThanOrEqual(120);
    }
    expect(new Set(filas.map((f) => f.nombreCliente)).size).toBeGreaterThan(5);
  });

  it('pobla telefono en todas las filas con formato 04XX-XXX-XXXX', () => {
    for (const f of filas) expect(f.telefono).toMatch(TELEFONO_RE);
    expect(new Set(filas.map((f) => f.telefono)).size).toBeGreaterThan(5);
  });

  it('pobla abonado con el identificador Fibex, no con la zona', () => {
    for (const f of filas) {
      expect(f.abonado).toMatch(/^\d{7}$/);
      expect(f.abonado).not.toContain(f.ubicacion);
    }
    expect(new Set(filas.map((f) => f.abonado)).size).toBe(filas.length);
  });

  it('pobla detalle, solucion, tipo y observacion del catálogo del front', () => {
    for (const f of filas) {
      expect(DETALLES).toContain(f.detalle);
      expect(SOLUCIONES).toContain(f.solucion);
      expect(TIPOS).toContain(f.tipo);
      expect(OBSERVACIONES).toContain(f.observacion);
    }
  });
});
