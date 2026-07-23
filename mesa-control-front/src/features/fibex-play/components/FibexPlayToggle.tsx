import { NavLink } from 'react-router-dom'
import { cx } from '../../../components/ui/cx'

const activo =
  'inline-flex items-center gap-[6px] rounded-chip border border-border bg-surface px-[13px] py-[7px] text-[13px] font-semibold text-text-primary shadow-elevation'
const inactivo =
  'inline-flex items-center gap-[6px] rounded-chip border border-transparent px-[13px] py-[7px] text-[13px] font-medium text-text-muted hover:text-text-primary'

/**
 * Toggle segmentado de la sección Fibex Play: navega entre la Grilla en Vivo y
 * la Gestión de Clientes. Compartido por ambos headers.
 */
export function FibexPlayToggle() {
  return (
    <nav
      aria-label="Vista de Fibex Play"
      className="flex gap-[2px] rounded-[9px] border border-border bg-bg p-[3px]"
    >
      <NavLink
        to="/fibex-play"
        end
        className={({ isActive }) => cx(isActive ? activo : inactivo)}
      >
        {({ isActive }) => (
          <>
            <span
              aria-hidden="true"
              className={cx(
                'h-[7px] w-[7px] rounded-pill',
                isActive ? 'animate-pulse bg-success' : 'bg-text-muted',
              )}
            />
            Grilla en Vivo
          </>
        )}
      </NavLink>
      <NavLink
        to="/fibex-play/gestion"
        className={({ isActive }) => cx(isActive ? activo : inactivo)}
      >
        Gestión de Clientes
      </NavLink>
    </nav>
  )
}
