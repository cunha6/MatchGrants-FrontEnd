import { useEffect, useState } from 'react'
import { cx } from '../utils/cx'
import styles from './SectionNav.module.css'

export interface SectionNavItem {
  id: string
  label: string
}

/** Sticky in-page navigation with scroll-spy active state (detail screens). */
export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')

  useEffect(() => {
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-140px 0px -70% 0px', threshold: 0 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [items])

  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActive(id)
    }
  }

  return (
    <nav className={styles.nav} aria-label="Secções">
      <div className={styles.inner}>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cx(styles.link, active === item.id && styles.active)}
            onClick={(e) => go(e, item.id)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
