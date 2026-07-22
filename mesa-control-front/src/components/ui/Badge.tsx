import type { HTMLAttributes } from 'react'
import { cx } from './cx'

export type BadgeTone =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const tones: Record<BadgeTone, string> = {
  success: 'text-success border-success bg-transparent',
  warning: 'text-warning border-warning bg-transparent',
  danger: 'text-danger border-danger bg-transparent',
  info: 'text-info border-info bg-transparent',
  neutral: 'text-neutral border-neutral bg-transparent',
  brand: 'text-brand border-brand-outline bg-brand-soft',
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-chip border px-2 py-1 text-label uppercase',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
