import type { ReactNode } from 'react'
import styles from './Section.module.css'

interface SectionProps {
  id?: string
  eyebrow?: ReactNode
  title: ReactNode
  actions?: ReactNode
  children: ReactNode
}

/** A titled content block (eyebrow + heading + optional actions) for detail
 *  screens. Matches the reference mock-ups' section rhythm. */
export function Section({ id, eyebrow, title, actions, children }: SectionProps) {
  return (
    <section id={id} className={styles.section}>
      <div className={styles.head}>
        <div>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <h2 className={styles.title}>{title}</h2>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {children}
    </section>
  )
}
