import type { ReactNode } from 'react'
import styles from './MetricsStrip.module.css'

export interface Metric {
  label: ReactNode
  value: ReactNode
  foot?: ReactNode
}

/** Row of surfaced KPIs shown under a DetailHero. */
export function MetricsStrip({ items }: { items: Metric[] }) {
  return (
    <div className={styles.grid}>
      {items.map((m, i) => (
        <div key={i} className={styles.metric}>
          <div className={styles.key}>{m.label}</div>
          <div className={styles.value}>{m.value}</div>
          {m.foot && <div className={styles.foot}>{m.foot}</div>}
        </div>
      ))}
    </div>
  )
}
