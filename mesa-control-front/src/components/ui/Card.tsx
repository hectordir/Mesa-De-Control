import type { HTMLAttributes } from 'react'
import { cx } from './cx'

export type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'bg-surface border border-border rounded-card shadow-elevation',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'border-b border-border-subtle px-4 py-3 text-h3 text-text-primary',
        className,
      )}
      {...props}
    />
  )
}

function CardBody({ className, ...props }: CardProps) {
  return (
    <div
      className={cx('px-4 py-4 text-body text-text-secondary', className)}
      {...props}
    />
  )
}

Card.Header = CardHeader
Card.Body = CardBody
