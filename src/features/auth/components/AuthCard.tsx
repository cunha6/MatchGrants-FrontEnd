import type { ReactNode } from 'react'
import styles from './AuthCard.module.css'

interface AuthCardProps {
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Wider card for the multi-field registration form. */
  wide?: boolean
}

/** Centered card shell shared by Login and Register. */
export function AuthCard({ title, subtitle, children, footer, wide }: AuthCardProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card} style={wide ? { maxWidth: 560 } : undefined}>
        <div className={styles.brand}>
          <span className={styles.dot} aria-hidden="true" />
          MatchGrants
        </div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
