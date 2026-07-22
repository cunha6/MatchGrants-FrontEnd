import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'
import { cx } from '../utils/cx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Removes inner padding (for tables/media that reach the edges). */
  flush?: boolean
  /** Adds hover lift (for clickable cards / list rows). */
  interactive?: boolean
}

export function Card({
  flush = false,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cx(
        styles.card,
        flush && styles.flush,
        interactive && styles.interactive,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  eyebrow?: ReactNode
  title?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

/** Optional standardized card header (eyebrow + title + right-aligned actions). */
export function CardHeader({ eyebrow, title, actions, children }: CardHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.headingGroup}>
        {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
        {title && <h3 className={styles.title}>{title}</h3>}
        {children}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  )
}
