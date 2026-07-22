import type { ReactNode } from 'react'
import styles from './DescriptionList.module.css'
import { cx } from '../utils/cx'

export interface DescriptionItem {
  label: ReactNode
  value: ReactNode
  /** Render the value in mono (codes, dates). */
  mono?: boolean
}

interface DescriptionListProps {
  items: DescriptionItem[]
  className?: string
}

/** Key/value meta list used on detail screens (rows with label ↔ value). */
export function DescriptionList({ items, className }: DescriptionListProps) {
  return (
    <dl className={cx(styles.list, className)}>
      {items.map((item, i) => (
        <div key={i} className={styles.row}>
          <dt className={styles.key}>{item.label}</dt>
          <dd className={cx(styles.value, item.mono && styles.mono)}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
