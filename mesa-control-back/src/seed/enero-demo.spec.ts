import { ResultadoGestion } from '../generated/prisma/enums';
import {
  DETALLES,
  GestionDemo,
  OBSERVACIONES,
  SOLUCIONES,
  TIPOS,
} from './gestiones-demo';
import { construirEneroDemo, PLAN_ENERO, PERIODO_ENERO } from './enero-demo';

/** Pool de 10 operadores: 5 "reales" del seed + 5 dummy, como en `prisma/seed.ts`. */
const POOL = Array.from({ length: 10 }, (_, i) => `op-${i}`);

const filas = construirEneroDemo(POOL);

/** Agrupa las gestiones por día (`YYYY-MM-DD`). */
function porDia(gs: readonly GestionDemo[]): Map<string, GestionDemo[]> {
  const mapa = new Map<string, GestionDemo[]>();
  for (const g of gs) {
    const clave = g.fecha.toISOString().slice(0, 10);
    (mapa.get(clave) ?? mapa.set(clave, []).get(clave)!).push(g);
  }
  return mapa;
}

const dias = porDia(filas);
const del = (dia: string): GestionDemo[] => dias.get(dia) ?? [];
const cuenta = (gs: readonly GestionDemo[], r: ResultadoGestion) =>
  gs.filter((g) => g.resultado === r).length;
const efectividad = (gs: readonly GestionDemo[]) =>
  gs.length === 0
    ? 0
    : Math.round((cuenta(gs, 'SOLUCIONADO_MESA') / gs.length) * 100);
const distintos = <K>(gs: readonly GestionDemo[], f: (g: GestionDemo) => K) =>
  new Set(gs.map(f)).size;

/** Día declarado en el plan con esa etiqueta de caso. */
const fechaDelCaso = (caso: string): string => {
  const plan = PLAN_ENERO.find((d) => d.caso === caso);
  if (!plan) throw new Error(`El plan no declara el caso "${caso}"`);
  return plan.fecha;
};

describe('construirEneroDemo — banco de casos borde', () => {
  it('siembra sólo días de enero de 2026', () => {
    expect(PERIODO_ENERO).toBe('2026-01');
    for (const clave of dias.keys())
      expect(clave.startsWith('2026-01-')).toBe(true);
    expect(filas.length).toBeGreaterThan(0);
  });

  it('cubre el primer y el último día del mes', () => {
    expect(del('2026-01-01').length).toBeGreaterThan(0);
    expect(del('2026-01-31').length).toBeGreaterThan(0);
  });

  /* ── Por volumen del día ─────────────────────────────────────────────── */

  it('deja un día del mes SIN ninguna gestión (estado vacío del Monitor)', () => {
    const vacio = fechaDelCaso('dia-vacio');
    expect(del(vacio)).toHaveLength(0);
  });

  it('tiene un día con exactamente 1 gestión', () => {
    expect(del(fechaDelCaso('una-gestion'))).toHaveLength(1);
  });

  it('tiene un día con 2–3 gestiones (defecto visual del 25 jul)', () => {
    const n = del(fechaDelCaso('pocas-gestiones')).length;
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
  });

  it('tiene un día de volumen alto que fuerza scroll (>= 100 gestiones)', () => {
    expect(del(fechaDelCaso('volumen-alto')).length).toBeGreaterThanOrEqual(
      100,
    );
  });

  /* ── Por operadores ──────────────────────────────────────────────────── */

  it('tiene un día atendido por un solo operador', () => {
    const gs = del(fechaDelCaso('un-operador'));
    expect(gs.length).toBeGreaterThan(1);
    expect(distintos(gs, (g) => g.operadorId)).toBe(1);
  });

  it('tiene un día con >= 8 operadores distintos (scroll de la tabla)', () => {
    const gs = del(fechaDelCaso('muchos-operadores'));
    expect(distintos(gs, (g) => g.operadorId)).toBeGreaterThanOrEqual(8);
  });

  it('tiene un día con un operador de efectividad 100 % y otro de 0 %', () => {
    const gs = del(fechaDelCaso('efectividad-dispar'));
    const porOperador = new Map<string, GestionDemo[]>();
    for (const g of gs) {
      (
        porOperador.get(g.operadorId) ??
        porOperador.set(g.operadorId, []).get(g.operadorId)!
      ).push(g);
    }
    const efectividades = [...porOperador.values()].map(efectividad);
    expect(efectividades).toContain(100);
    expect(efectividades).toContain(0);
  });

  /* ── Por resultado / métricas ────────────────────────────────────────── */

  it('tiene un día con los cinco resultados presentes', () => {
    const gs = del(fechaDelCaso('cinco-resultados'));
    for (const r of [
      'SOLUCIONADO_MESA',
      'ENVIADO_SOPORTE2',
      'ESCALADO_NOC',
      'PENDIENTE_CLIENTE',
      'REAGENDADO',
    ] as ResultadoGestion[]) {
      expect(cuenta(gs, r)).toBeGreaterThan(0);
    }
  });

  it('tiene un día con un único resultado (dona al 100 %)', () => {
    const gs = del(fechaDelCaso('resultado-unico'));
    expect(gs.length).toBeGreaterThan(1);
    expect(distintos(gs, (g) => g.resultado)).toBe(1);
  });

  it('tiene un día por encima y otro por debajo de la meta de efectividad (75 %)', () => {
    expect(efectividad(del(fechaDelCaso('resultado-unico')))).toBeGreaterThan(
      75,
    );
    expect(efectividad(del(fechaDelCaso('efectividad-baja')))).toBeLessThan(75);
  });

  it('tiene un día que supera la meta de Escalados a NOC (25) y otro que la cumple', () => {
    expect(
      cuenta(del(fechaDelCaso('noc-sobre-meta')), 'ESCALADO_NOC'),
    ).toBeGreaterThan(25);
    const cumple = cuenta(del(fechaDelCaso('metas-en-verde')), 'ESCALADO_NOC');
    expect(cumple).toBeGreaterThan(0);
    expect(cumple).toBeLessThanOrEqual(25);
  });

  it('tiene un día que supera la meta de Pendiente Cliente (40)', () => {
    expect(
      cuenta(del(fechaDelCaso('pendiente-sobre-meta')), 'PENDIENTE_CLIENTE'),
    ).toBeGreaterThan(40);
  });

  it('el día "metas-en-verde" cumple las tres metas a la vez', () => {
    const gs = del(fechaDelCaso('metas-en-verde'));
    expect(efectividad(gs)).toBeGreaterThanOrEqual(75);
    expect(cuenta(gs, 'ESCALADO_NOC')).toBeLessThanOrEqual(25);
    expect(cuenta(gs, 'PENDIENTE_CLIENTE')).toBeLessThanOrEqual(40);
  });

  /* ── Por averías / zonas ─────────────────────────────────────────────── */

  it('tiene un día con menos de 5 motivos distintos (Top 5 con lista corta)', () => {
    const gs = del(fechaDelCaso('pocos-motivos'));
    expect(gs.length).toBeGreaterThan(5);
    expect(distintos(gs, (g) => g.motivo)).toBeLessThan(5);
  });

  it('tiene un día con más de 5 motivos distintos (el Top 5 recorta)', () => {
    expect(
      distintos(del(fechaDelCaso('muchos-motivos')), (g) => g.motivo),
    ).toBeGreaterThan(5);
  });

  it('reparte >= 10 zonas y >= 6 motivos a lo largo del mes (heatmap y mapa no planos)', () => {
    expect(distintos(filas, (g) => g.ubicacion)).toBeGreaterThanOrEqual(10);
    expect(distintos(filas, (g) => g.motivo)).toBeGreaterThanOrEqual(6);
  });

  /* ── Por calendario ──────────────────────────────────────────────────── */

  it('incluye fines de semana sin actividad y otros con actividad baja', () => {
    const finDeSemana = (dia: string) => {
      const d = new Date(`${dia}T00:00:00.000Z`).getUTCDay();
      return d === 0 || d === 6;
    };
    const findes = PLAN_ENERO.filter((d) => finDeSemana(d.fecha));
    expect(findes.length).toBeGreaterThan(0);
    expect(findes.some((d) => del(d.fecha).length === 0)).toBe(true);
    const bajos = findes.filter((d) => {
      const n = del(d.fecha).length;
      return n > 0 && n <= 3;
    });
    expect(bajos.length).toBeGreaterThan(0);
  });

  it('da una tendencia diaria con variación real (no una línea plana)', () => {
    const volumenes = PLAN_ENERO.map((d) => del(d.fecha).length);
    expect(new Set(volumenes).size).toBeGreaterThanOrEqual(8);
    expect(Math.max(...volumenes) - Math.min(...volumenes)).toBeGreaterThan(50);
  });

  it('mantiene el volumen total del mes bajo (variedad, no volumen)', () => {
    expect(filas.length).toBeLessThan(1000);
  });

  /* ── Forma de las filas / idempotencia ───────────────────────────────── */

  it('pobla canal, duración, abonado y motivo en todas las filas', () => {
    for (const g of filas) {
      expect(['LLAMADA', 'WHATSAPP', 'TELEGRAM']).toContain(g.canal);
      expect(g.duracion).toBeGreaterThanOrEqual(2);
      expect(g.duracion).toBeLessThanOrEqual(30);
      expect(g.abonado.length).toBeGreaterThan(0);
      expect(g.motivo.length).toBeGreaterThan(0);
      expect(g.ubicacion.length).toBeGreaterThan(0);
    }
    expect(distintos(filas, (g) => g.canal)).toBe(3);
  });

  it('sitúa cada createdAt dentro de su propio día', () => {
    for (const g of filas) {
      expect(g.createdAt.toISOString().slice(0, 10)).toBe(
        g.fecha.toISOString().slice(0, 10),
      );
    }
  });

  it('usa sólo operadores del pool recibido', () => {
    for (const g of filas) expect(POOL).toContain(g.operadorId);
  });

  it('es determinista e idempotente: ids únicos y estables al reconstruir', () => {
    const otra = construirEneroDemo(POOL);
    expect(otra.map((g) => g.id)).toEqual(filas.map((g) => g.id));
    expect(new Set(filas.map((g) => g.id)).size).toBe(filas.length);
    for (const g of filas) expect(g.id.startsWith('enero-')).toBe(true);
  });

  it('el plan declara un día por cada fecha del mes, sin repetir', () => {
    expect(PLAN_ENERO).toHaveLength(31);
    expect(new Set(PLAN_ENERO.map((d) => d.fecha)).size).toBe(31);
    expect(new Set(PLAN_ENERO.map((d) => d.caso)).size).toBe(31);
  });

  it('pobla nombreCliente en todas las gestiones', () => {
    for (const g of filas) {
      expect(g.nombreCliente).toMatch(/^\S+ \S+$/u);
      expect(g.nombreCliente.length).toBeLessThanOrEqual(120);
    }
    expect(new Set(filas.map((g) => g.nombreCliente)).size).toBeGreaterThan(5);
  });

  it('pobla telefono en todas las gestiones', () => {
    for (const g of filas) {
      expect(g.telefono).toMatch(/^04(12|14|16|24|26)-\d{3}-\d{4}$/);
    }
    expect(new Set(filas.map((g) => g.telefono)).size).toBeGreaterThan(5);
  });

  it('pobla abonado Fibex y los campos de atención del catálogo del front', () => {
    for (const g of filas) {
      expect(g.abonado).toMatch(/^\d{7}$/);
      expect(g.abonado).not.toContain(g.ubicacion);
      expect(DETALLES).toContain(g.detalle);
      expect(SOLUCIONES).toContain(g.solucion);
      expect(TIPOS).toContain(g.tipo);
      expect(OBSERVACIONES).toContain(g.observacion);
    }
  });
});
