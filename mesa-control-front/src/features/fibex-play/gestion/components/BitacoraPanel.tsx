import { Button } from '../../../../components/ui'
import type { RegistroAtencion } from '../../../../lib/api/types'
import { Panel } from '../../../dashboard/components/PanelStates'
import { BitacoraTabla } from './BitacoraTabla'

interface BitacoraPanelProps {
  registros: RegistroAtencion[]
  onNuevo: () => void
}

/** Bitácora de atención: cabecera con CTA + tabla (o estado vacío grande). */
export function BitacoraPanel({ registros, onNuevo }: BitacoraPanelProps) {
  const hayRegistros = registros.length > 0
  const boton = (
    <Button variant="primary" size="sm" onClick={onNuevo}>
      <span aria-hidden="true">+</span> Nuevo Registro
    </Button>
  )
  return (
    <Panel
      titulo="Bitácora de Atención App"
      subtitulo={`${registros.length} ${
        registros.length === 1 ? 'registro' : 'registros'
      } de atención`}
      estado="data"
      accion={boton}
    >
      {hayRegistros ? (
        <BitacoraTabla registros={registros} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
          <div
            aria-hidden="true"
            className="flex h-[56px] w-[56px] items-center justify-center rounded-[14px] border-[1.5px] border-dashed border-border text-[24px] text-text-muted"
          >
            ◈
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-semibold text-text-primary">
              Sin registros de atención
            </p>
            <p className="max-w-[320px] text-caption leading-[1.5] text-text-muted">
              Aún no se ha registrado ninguna atención de la App Fibex. Crea el
              primer registro para poblar la bitácora.
            </p>
          </div>
          {boton}
        </div>
      )}
    </Panel>
  )
}
