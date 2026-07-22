import { useEffect, useState, type ReactNode } from 'react'
import styles from './Deadline.module.css'
import { cx } from '../utils/cx'
import { daysUntil, formatDate } from '../utils/format'

interface DeadlineProps {
  label: string
  date: string | null | undefined
  /** Period start (opening / publication) — used for the ring fill fraction. */
  start?: string | null
  sub?: ReactNode
}

const R = 42
const C = 2 * Math.PI * R

/** Deadline panel with a circular days-remaining ring + date + status pill. */
export function Deadline({ label, date, start, sub }: DeadlineProps) {
  const days = daysUntil(date)

  // The ring is a countdown progress bar: full at the period start, emptying
  // as the deadline approaches (frac = time remaining ÷ total period).
  // Colour is driven by the ABSOLUTE days left: green >30, amber ≤30, red ≤7.
  let tone: 'ok' | 'mid' | 'low' | 'closed' | 'none' = 'none'
  let text = 'Sem data definida'
  let shown = '—'
  let frac = 0

  if (days !== null) {
    if (days <= 0) {
      tone = 'closed'
      text = 'Prazo encerrado'
      shown = '0'
      frac = 0
    } else {
      shown = String(days)
      if (start) {
        const total = Math.max(
          1,
          Math.round((Date.parse(date as string) - Date.parse(start)) / 86_400_000),
        )
        frac = Math.max(0, Math.min(1, days / total))
      } else {
        frac = Math.max(0, Math.min(1, days / 60))
      }
      if (days > 30) {
        tone = 'ok'
        text = `Em aberto — ${days} dias restantes`
      } else if (days > 7) {
        tone = 'mid'
        text = `Faltam ${days} dias`
      } else {
        tone = 'low'
        text = `A terminar — ${days} dia${days === 1 ? '' : 's'}`
      }
    }
  }

  // Animate the ring from empty to target on mount.
  const [offset, setOffset] = useState(C)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(C * (1 - frac)))
    return () => cancelAnimationFrame(id)
  }, [frac])

  return (
    <div className={styles.panel}>
      <div className={styles.label}>{label}</div>
      <div className={styles.ringRow}>
        <div className={styles.ring}>
          <svg width="92" height="92" viewBox="0 0 96 96" aria-hidden="true">
            <circle cx="48" cy="48" r={R} fill="none" stroke="var(--color-surface-3)" strokeWidth="9" />
            <circle
              className={cx(styles.ringFg, styles[tone])}
              cx="48"
              cy="48"
              r={R}
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C.toFixed(1)}
              strokeDashoffset={offset.toFixed(1)}
              transform="rotate(-90 48 48)"
            />
          </svg>
          <div className={styles.num}>
            <b>{shown}</b>
            <span>dias</span>
          </div>
        </div>
        <div>
          <div className={styles.date}>{formatDate(date)}</div>
          {sub && <div className={styles.sub}>{sub}</div>}
        </div>
      </div>
      <div className={cx(styles.pill, styles[tone])}>
        <span className={styles.dot} aria-hidden="true" />
        {text}
      </div>
    </div>
  )
}
