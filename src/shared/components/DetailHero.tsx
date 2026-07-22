import type { ReactNode } from 'react'
import styles from './DetailHero.module.css'

interface DetailHeroProps {
  eyebrow?: ReactNode
  badges?: ReactNode
  title: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  /** Right-hand panel (e.g. a <Deadline>). */
  aside?: ReactNode
}

/** Signature dark hero used at the top of detail screens. */
export function DetailHero({
  eyebrow,
  badges,
  title,
  meta,
  actions,
  aside,
}: DetailHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.grid}>
        <div className={styles.main}>
          {badges && <div className={styles.badges}>{badges}</div>}
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <h1 className={styles.title}>{title}</h1>
          {meta && <div className={styles.meta}>{meta}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
    </header>
  )
}
