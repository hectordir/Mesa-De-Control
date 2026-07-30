import type { GestionResponse } from '../../../lib/api/types'
import type { GestionFormValues } from '../../registro/hooks/useGestionForm'

/**
 * Traduce el detalle de `GET /gestiones/:id` al estado del formulario
 * compartido con el registro. `coordenadas` nulas → cadena vacía (el mapa
 * arranca sin pin, igual que en un alta).
 */
export function aValoresFormulario(g: GestionResponse): GestionFormValues {
  return {
    operadorId: g.operador.id,
    fecha: g.fecha,
    abonado: g.abonado,
    nombreCliente: g.nombreCliente,
    telefono: g.telefono,
    detalle: g.detalle,
    solucion: g.solucion,
    resultado: g.resultado,
    tipo: g.tipo,
    requiereVisita: g.requiereVisita,
    coordenadas: g.coordenadas ?? '',
    zona: g.zona,
    motivo: g.motivo,
    observacion: g.observacion,
  }
}
