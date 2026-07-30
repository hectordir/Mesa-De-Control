import { NavLink } from 'react-router-dom'
import { cx } from '../../../components/ui/cx'
import { useAuthStore } from '../../../stores/auth.store'
import type { Role } from '../../../lib/api/types'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

/** Secciones del producto; `roles` restringe la visibilidad cuando aplica. */
const SECCIONES: { label: string; to: string; roles?: Role[] }[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Registro', to: '/registro' },
  { label: 'Historial', to: '/historial' },
  { label: 'Fibex Play', to: '/fibex-play' },
  { label: 'Admin', to: '/admin', roles: ['ADMIN', 'SUPERVISOR'] },
]

function MainNav() {
  const role = useAuthStore((state) => state.user?.role)
  const visibles = SECCIONES.filter(
    (s) => !s.roles || (role !== undefined && s.roles.includes(role)),
  )
  return (
    <nav aria-label="Secciones" className="flex min-w-0 items-center gap-1 overflow-hidden">
      {visibles.map((seccion) => (
        <NavLink
          key={seccion.label}
          to={seccion.to}
          className={({ isActive }) =>
            cx(
              'rounded-control px-[12px] py-[7px] text-[13px]',
              isActive
                ? 'bg-brand-nav font-semibold text-brand'
                : 'font-medium text-text-secondary hover:text-text-primary',
            )
          }
        >
          {seccion.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Barra superior: marca, navegación, tema y sesión. */
export function AppTopBar() {
  return (
    <header className="flex h-14 items-center gap-[14px] rounded-card border border-border bg-surface px-[14px] shadow-elevation">
      <div className="flex flex-shrink-0 items-center gap-2 border-r border-border-subtle pr-[14px]">
        <span
          aria-hidden="true"
          className="flex h-[22px] w-[22px] items-center justify-center rounded-chip bg-brand text-[13px] font-bold text-brand-fg"
        >
          F
        </span>
        <span className="text-[15px] font-bold tracking-[-.01em]">Fibex Control</span>
      </div>
      <MainNav />
      <div className="min-w-[16px] flex-1" />
      <div className="flex flex-shrink-0 items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
