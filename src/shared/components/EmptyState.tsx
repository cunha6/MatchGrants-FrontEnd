import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title?: ReactNode
  message?: ReactNode
  action?: ReactNode
  icon?: ReactNode
}

/** Consistent "sem resultados" / empty placeholder. */
export function EmptyState({
  title = 'Sem resultados',
  message,
  action,
  icon = '∅',
}: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <p className={styles.title}>{title}</p>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
