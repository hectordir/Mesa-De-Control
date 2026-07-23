import { describe, expect, it } from 'vitest'
import {
  RESULTADOS_ORDEN,
  resultadoPresentation,
} from './resultado.presentation'

describe('resultado.presentation', () => {
  it('mapea cada resultado del enum a su etiqueta y tono semántico', () => {
    expect(resultadoPresentation('SOLUCIONADO_MESA')).toEqual({
      label: 'Solucionado en Mesa',
      tone: 'success',
    })
    expect(resultadoPresentation('ENVIADO_SOPORTE2')).toEqual({
      label: 'Enviado a Soporte 2',
      tone: 'warning',
    })
    expect(resultadoPresentation('ESCALADO_NOC')).toEqual({
      label: 'Escalado a NOC',
      tone: 'danger',
    })
    expect(resultadoPresentation('PENDIENTE_CLIENTE')).toEqual({
      label: 'Pendiente Cliente',
      tone: 'info',
    })
    expect(resultadoPresentation('REAGENDADO')).toEqual({
      label: 'Reagendado',
      tone: 'neutral',
    })
  })

  it('degrada con un default seguro para valores desconocidos del enum', () => {
    expect(resultadoPresentation('OTRO_VALOR')).toEqual({
      label: 'OTRO_VALOR',
      tone: 'neutral',
    })
  })

  it('expone el orden fijo de los resultados para las chips', () => {
    expect(RESULTADOS_ORDEN).toEqual([
      'SOLUCIONADO_MESA',
      'ENVIADO_SOPORTE2',
      'ESCALADO_NOC',
      'PENDIENTE_CLIENTE',
      'REAGENDADO',
    ])
  })
})
