import type { ReactNode } from 'react'
import styles from './Tag.module.css'
import { cx } from '../utils/cx'

interface TagProps {
  /** Optional mono "code" shown before the label (e.g. a CPV/CAE code). */
  code?: ReactNode
  children?: ReactNode
  /** Muted style for excluded/secondary tags. */
  muted?: boolean
  className?: string
}

/** Chip used for CPV/CAE codes, sectors and other classification labels. */
export function Tag({ code, children, muted = false, className }: TagProps) {
  return (
    <span className={cx(styles.tag, muted && styles.muted, className)}>
      {code && <code className={styles.code}>{code}</code>}
      {children}
    </span>
  )
}
