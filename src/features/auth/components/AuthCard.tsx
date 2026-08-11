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
export function AuthCard({ subtitle, children, footer, wide }: AuthCardProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.card} style={wide ? { maxWidth: 560 } : undefined}>
        {/* Centred lockup: the mark needs room to read, and a centred header
            over a left-aligned form is the familiar sign-in shape. */}
        <div className={styles.head}>
          <img className={styles.logo} src="/logo.png" alt="" />
          <div className={styles.brand}>FundMatch</div>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
