import { CAIDOS, construirCanales, TOTAL_CANALES } from './canales';

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
});
