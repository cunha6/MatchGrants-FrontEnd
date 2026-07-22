import type { ReactNode } from 'react'
import styles from './Chips.module.css'
import { cx } from '../utils/cx'

/** Flex-wrapping container for Tag/Badge groups (CPV codes, sectors, …). */
export function Chips({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx(styles.chips, className)}>{children}</div>
}
