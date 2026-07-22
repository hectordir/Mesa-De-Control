import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../stores/auth.store'
import { iniciales } from '../derive'
import { LogoutIcon } from './icons'

/** Avatar con las iniciales de la sesión activa y salida del sistema. */
export function UserMenu() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const nombre = user?.name ?? 'Invitado'

  function salir() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex items-center gap-2 border-l border-border-subtle pl-3">
      <span
        aria-label={`Sesión de ${nombre}`}
        className="flex h-[30px] w-[30px] items-center justify-center rounded-pill bg-brand-avatar text-caption font-bold text-brand"
      >
        {iniciales(nombre)}
      </span>
      <button
        type="button"
        onClick={salir}
        className="inline-flex items-center gap-1 rounded-chip px-1 text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <LogoutIcon size={14} />
        Salir
      </button>
    </div>
  )
}
