import { NavLink } from 'react-router-dom'
import { cx } from '../../../components/ui/cx'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'

const EMPRESAS = ['Mesa de Control', 'Fibex Telecom', 'Soporte-NOC'] as const

/** Secciones del producto; sólo Dashboard está implementada. */
const SECCIONES = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Registro', to: '/registro' },
  { label: 'Historial', to: null },
  { label: 'Fibex Play', to: null },
  { label: 'Admin', to: null },
] as const

function CompanyTabs() {
  return (
    <div
      role="tablist"
      aria-label="Empresa"
      className="flex flex-shrink-0 gap-[2px] rounded-control border border-border-subtle bg-bg p-[3px]"
    >
      {EMPRESAS.map((empresa, index) => {
        const activa = index === 0
        return (
          <button
            key={empresa}
            role="tab"
            type="button"
            aria-selected={activa}
            tabIndex={activa ? 0 : -1}
            className={cx(
              'rounded-chip px-[10px] py-[5px] text-caption',
              activa
                ? 'border border-border bg-surface font-semibold text-text-primary shadow-elevation'
                : 'border border-transparent font-medium text-text-secondary',
            )}
          >
            {empresa}
          </button>
        )
      })}
    </div>
  )
}

function MainNav() {
  return (
    <nav aria-label="Secciones" className="flex min-w-0 gap-[2px] overflow-hidden">
      {SECCIONES.map((seccion) =>
        seccion.to ? (
          <NavLink
            key={seccion.label}
            to={seccion.to}
            className={({ isActive }) =>
              cx(
                'rounded-control px-[10px] py-[7px] text-[13px]',
                isActive
                  ? 'bg-brand-nav font-semibold text-brand'
                  : 'font-medium text-text-secondary hover:text-text-primary',
              )
            }
          >
            {seccion.label}
          </NavLink>
        ) : (
          <span
            key={seccion.label}
            aria-disabled="true"
            title="Disponible próximamente"
            className="rounded-control px-[10px] py-[7px] text-[13px] font-medium text-text-secondary"
          >
            {seccion.label}
          </span>
        ),
      )}
    </nav>
  )
}

/** Barra superior: marca, empresa, navegación, tema y sesión. */
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
      <CompanyTabs />
      <MainNav />
      <div className="min-w-[8px] flex-1" />
      <div className="flex flex-shrink-0 items-center gap-3">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
