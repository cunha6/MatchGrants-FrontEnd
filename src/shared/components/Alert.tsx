import type { ReactNode } from 'react'
import styles from './Alert.module.css'
import { cx } from '../utils/cx'

export type AlertVariant = 'info' | 'success' | 'danger' | 'warning'

interface AlertProps {
  variant?: AlertVariant
  title?: ReactNode
  children?: ReactNode
  /** Optional action area (e.g. a "retry" button). */
  action?: ReactNode
  onClose?: () => void
  className?: string
}

const ICONS: Record<AlertVariant, string> = {
  info: 'ℹ',
  success: '✓',
  danger: '!',
  warning: '⚠',
}

export function Alert({
  variant = 'info',
  title,
  children,
  action,
  onClose,
  className,
}: AlertProps) {
  return (
    <div
      className={cx(styles.alert, styles[variant], className)}
      role={variant === 'danger' ? 'alert' : 'status'}
    >
      <span className={styles.icon} aria-hidden="true">
        {ICONS[variant]}
      </span>
      <div className={styles.body}>
        {title && <div className={styles.title}>{title}</div>}
        {children && <div className={styles.message}>{children}</div>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
      {onClose && (
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      )}
    </div>
  )
}
