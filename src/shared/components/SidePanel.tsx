import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../utils/cx'
import styles from './SidePanel.module.css'

interface SidePanelProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  ariaLabel?: string
}

/** Right-side slide-in detail panel: ESC, backdrop click, or the X close it. */
export function SidePanel({ open, onClose, title, children, ariaLabel }: SidePanelProps) {
  useEffect(() => {
    if (!open) return
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <div className={cx(styles.root, open && styles.open)} aria-hidden={!open}>
      <div className={styles.overlay} onClick={onClose} />
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </aside>
    </div>,
    document.body,
  )
}
