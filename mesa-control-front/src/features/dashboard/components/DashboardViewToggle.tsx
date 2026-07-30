import { NavLink } from 'react-router-dom'
import { cx } from '../../../components/ui/cx'

/** Las dos vistas del dashboard; el segmento activo se deduce de la ruta. */
const VISTAS = [
  { label: 'Monitor Diario', to: '/dashboard', end: true },
  { label: 'Análisis Mensual', to: '/dashboard/analisis-mensual', end: false },
] as const

/**
 * Ancho fijo de cada segmento: sin él, el segmento activo (más ancho por la
 * negrita) reposiciona al vecino y el toggle "salta" al cambiar de ruta.
 */
export const ANCHO_SEGMENTO = 'w-[156px]'

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
              'inline-flex items-center justify-center gap-[6px] rounded-chip px-[13px] py-[7px] text-[13px]',
              ANCHO_SEGMENTO,
              isActive
                ? 'border border-border bg-surface font-semibold text-text-primary shadow-elevation'
                : 'border border-transparent font-medium text-text-secondary hover:text-text-primary',
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* El punto siempre ocupa su hueco: invisible cuando no toca. */}
              <span
                aria-hidden="true"
                data-testid="punto-vista"
                className={cx(
                  'h-[6px] w-[6px] shrink-0 rounded-pill bg-brand',
                  !isActive && 'invisible',
                )}
              />
              {vista.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
