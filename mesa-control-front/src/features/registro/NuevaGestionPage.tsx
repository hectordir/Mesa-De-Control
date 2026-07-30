import { useState } from 'react'
import { AppTopBar } from '../dashboard/components/AppTopBar'
import { GestionForm } from './components/GestionForm'
import { GuardadoToast } from './components/GuardadoToast'

/** Registro → Nueva Gestión: alta de una atención de la mesa de control. */
export default function NuevaGestionPage() {
  const [guardado, setGuardado] = useState(false)

  return (
    <div className="tabular flex min-h-screen flex-col gap-5 bg-bg p-6 font-sans text-text-primary">
      <AppTopBar />

      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] font-bold leading-tight tracking-[-.02em]">
          Nueva Gestión
        </h1>
        <p className="text-[13px] text-text-muted">
          Registra una atención directa en la mesa de control.
        </p>
      </div>

      <GestionForm onGuardado={() => setGuardado(true)} />

      <GuardadoToast visible={guardado} onClose={() => setGuardado(false)} />
    </div>
  )
}
