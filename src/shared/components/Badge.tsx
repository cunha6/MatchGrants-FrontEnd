import type { ReactNode } from 'react'
import styles from './Badge.module.css'
import { cx } from '../utils/cx'

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'primary'

interface BadgeProps {
  variant?: BadgeVariant
  /** Show a leading status dot. */
  dot?: boolean
  children: ReactNode
  className?: string
}

export function Badge({
  variant = 'neutral',
  dot = false,
  children,
  className,
}: BadgeProps) {
  return (
    <span className={cx(styles.badge, styles[variant], className)}>
      {dot && <span className={styles.dot} aria-hidden="true" />}
      {children}
    </span>
  )
}

/** Convenience: active / inactive badge used across lists. */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? 'success' : 'neutral'} dot>
      {active ? 'Ativo' : 'Inativo'}
    </Badge>
  )
}
