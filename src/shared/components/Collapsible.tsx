import { useState, type ReactNode } from 'react'
import { cx } from '../utils/cx'
import styles from './Collapsible.module.css'

interface CollapsibleProps {
  title: ReactNode
  /** Optional count badge (e.g. number of items hidden inside). */
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}

/** A titled block that hides its content until clicked — used to keep
 *  information-heavy sections readable (documents, legislation, …). */
export function Collapsible({
  title,
  count,
  defaultOpen = false,
  children,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cx(styles.wrap, open && styles.open)}>
      <button
        type="button"
        className={styles.head}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.chev} aria-hidden="true">
          ›
        </span>
        <span className={styles.title}>{title}</span>
        {count != null && <span className={styles.count}>{count}</span>}
      </button>
      {open && <div className={styles.body}>{children}</div>}
    </div>
  )
}
