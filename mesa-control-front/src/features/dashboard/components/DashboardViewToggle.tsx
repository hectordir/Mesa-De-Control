import { NavLink } from 'react-router-dom'
import { cx } from '../../../components/ui/cx'

/** Las dos vistas del dashboard; el segmento activo se deduce de la ruta. */
const VISTAS = [
  { label: 'Monitor Diario', to: '/dashboard', end: true },
  { label: 'Análisis Mensual', to: '/dashboard/analisis-mensual', end: false },
] as const

/** Conmutador Monitor Diario | Análisis Mensual, compartido por ambas vistas. */
export function DashboardViewToggle() {
  return (
    <nav
      aria-label="Vista del dashboard"
      className="flex gap-[2px] rounded-[9px] border border-border bg-bg p-[3px]"
    >
      {VISTAS.map((vista) => (
        <NavLink
          key={vista.to}
          to={vista.to}
          end={vista.end}
          className={({ isActive }) =>
            cx(
              'inline-flex items-center gap-[6px] rounded-chip px-[13px] py-[7px] text-[13px]',
              isActive
                ? 'border border-border bg-surface font-semibold text-text-primary shadow-elevation'
                : 'border border-transparent font-medium text-text-secondary hover:text-text-primary',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="h-[6px] w-[6px] rounded-pill bg-brand"
                />
              ) : null}
              {vista.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
