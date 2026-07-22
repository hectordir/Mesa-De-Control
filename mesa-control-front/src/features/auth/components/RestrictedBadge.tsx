import { Badge } from '../../../components/ui'
import { ShieldIcon } from './icons'

/** Píldora "Acceso restringido" con icono de escudo. */
export function RestrictedBadge() {
  return (
    <Badge
      tone="brand"
      className="gap-[7px] rounded-pill px-[13px] py-[6px] text-caption font-bold tracking-[.08em]"
    >
      <ShieldIcon />
      Acceso restringido
    </Badge>
  )
}
