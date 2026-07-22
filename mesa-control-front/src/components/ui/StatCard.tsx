import type { ReactNode } from 'react'
import { Card, type CardProps } from './Card'
import { cx } from './cx'

export interface StatCardProps extends Omit<CardProps, 'children'> {
  label: string
  value: ReactNode
  hint?: ReactNode
}

export function StatCard({
  label,
  value,
  hint,
  className,
  ...props
}: StatCardProps) {
  return (
    <Card className={cx('p-4', className)} {...props}>
      <p className="text-label uppercase text-text-muted">{label}</p>
      <p className="text-display text-text-primary">{value}</p>
      {hint ? <p className="text-caption text-text-secondary">{hint}</p> : null}
    </Card>
  )
}
