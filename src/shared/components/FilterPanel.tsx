import { useState, type ReactNode } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { MEDIA } from '../constants/breakpoints'
import { cx } from '../utils/cx'
import styles from './FilterPanel.module.css'

interface FilterPanelProps {
  children: ReactNode
  /** Number of active filters (shown as a badge on the mobile toggle). */
  activeCount?: number
  onClear?: () => void
  title?: string
}

/**
 * Filter container: an always-open card on desktop, a collapsible "Filtros"
 * drawer on mobile. Children are laid out in a responsive grid.
 */
export function FilterPanel({
  children,
  activeCount = 0,
  onClear,
  title = 'Filtros',
}: FilterPanelProps) {
  const isMobile = useMediaQuery(MEDIA.mdDown)
  const [open, setOpen] = useState(false)
  const expanded = !isMobile || open

  return (
    <section className={styles.panel} aria-label={title}>
      <div className={styles.head}>
        {isMobile ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={expanded}
          >
            <span className={styles.filterIcon} aria-hidden="true">
              ⛭
            </span>
            {title}
            {activeCount > 0 && <span className={styles.count}>{activeCount}</span>}
            <span className={cx(styles.chev, expanded && styles.chevOpen)}>›</span>
          </button>
        ) : (
          <h2 className={styles.title}>
            {title}
            {activeCount > 0 && <span className={styles.count}>{activeCount}</span>}
          </h2>
        )}
        {onClear && activeCount > 0 && (
          <button type="button" className={styles.clear} onClick={onClear}>
            Limpar
          </button>
        )}
      </div>
      {expanded && <div className={styles.body}>{children}</div>}
    </section>
  )
}
