import { cx } from '../../../components/ui/cx'
import { healthRingBg, saludMeta } from '../lib/fibexPlay.presentation'

/** Anillo (conic-gradient) con el % de salud de la grilla y un glifo central. */
export function HealthRing({ health }: { health: number }) {
  const meta = saludMeta(health)
  return (
    <div
      role="img"
      aria-label={`Salud de la grilla ${health}%`}
      className={cx('relative h-[72px] w-[72px] flex-shrink-0 rounded-pill', meta.text)}
      style={{ background: healthRingBg(health, meta.token) }}
    >
      <div className="absolute inset-[9px] flex items-center justify-center rounded-pill bg-surface">
        <span className={cx('text-[22px] font-bold leading-none', meta.text)}>
          {meta.glifo}
        </span>
      </div>
    </div>
  )
}
