import {
  CAIDOS,
  construirCanales,
  sembrarCanales,
  TOTAL_CANALES,
} from './canales';
import { diaLocal } from './dia';

describe('construirCanales', () => {
  const canales = construirCanales();

  it('genera exactamente 165 canales', () => {
    expect(canales).toHaveLength(TOTAL_CANALES);
    expect(TOTAL_CANALES).toBe(165);
  });

  it('marca 6 caídos y 159 operativos', () => {
    const caidos = canales.filter((c) => c.estado === 'CAIDO');
    const operativos = canales.filter((c) => c.estado === 'OPERATIVO');
    expect(caidos).toHaveLength(6);
    expect(operativos).toHaveLength(159);
  });

  it('replica los 6 caídos con los datos exactos del spec', () => {
    const caidos = canales.filter((c) => c.estado === 'CAIDO');
    expect(
      caidos.map((c) => ({
        nombre: c.nombre,
        categoria: c.categoria,
        tipoIncidencia: c.tipoIncidencia,
        severidad: c.severidad,
        hora: c.detectadoEn?.toISOString().slice(11, 16),
      })),
    ).toEqual(CAIDOS.map((c) => ({ ...c })));
  });

  it('los caídos tienen incidencia/severidad/detectadoEn; los operativos no', () => {
    for (const c of canales) {
      if (c.estado === 'CAIDO') {
        expect(c.tipoIncidencia).not.toBeNull();
        expect(c.severidad).not.toBeNull();
        expect(c.detectadoEn).toBeInstanceOf(Date);
      } else {
        expect(c.tipoIncidencia).toBeNull();
        expect(c.severidad).toBeNull();
        expect(c.detectadoEn).toBeNull();
      }
    }
  });

  it('es determinista: ids fijos y misma salida en cada corrida', () => {
    expect(construirCanales()).toEqual(canales);
    expect(new Set(canales.map((c) => c.id)).size).toBe(TOTAL_CANALES);
    expect(canales[0].id).toBe('canal-0001');
  });

  it('detecta las caídas en el día de HOY por defecto', () => {
    const hoy = diaLocal();
    for (const c of canales.filter((x) => x.estado === 'CAIDO')) {
      expect(diaLocal(c.detectadoEn!)).toBe(hoy);
    }
  });

  it('acepta un día base explícito', () => {
    const base = new Date(2026, 2, 5, 12, 0, 0);
    for (const c of construirCanales(base).filter((x) => x.detectadoEn)) {
      expect(c.detectadoEn!.toISOString().slice(0, 10)).toBe('2026-03-05');
    }
  });
});

describe('sembrarCanales', () => {
  it('inserta con skipDuplicates y refresca detectadoEn de los 6 caídos', async () => {
    const updates: { id: string; detectadoEn: Date }[] = [];
    const prisma = {
      canal: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        updateMany: jest
          .fn()
          .mockImplementation(
            (args: { where: { id: string }; data: { detectadoEn: Date } }) => {
              updates.push({
                id: args.where.id,
                detectadoEn: args.data.detectadoEn,
              });
              return Promise.resolve({ count: 1 });
            },
          ),
      },
    };

    const { count, actualizadas } = await sembrarCanales(prisma);

    expect(count).toBe(0);
    expect(actualizadas).toBe(6);
    const hoy = diaLocal();
    for (const u of updates) expect(diaLocal(u.detectadoEn)).toBe(hoy);
  });
});
