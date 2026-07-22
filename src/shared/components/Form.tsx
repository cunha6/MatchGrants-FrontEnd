import type { FormHTMLAttributes, ReactNode } from 'react'
import styles from './Form.module.css'
import { cx } from '../utils/cx'

/** <form> with a vertical stack of fields. */
export function Form({
  className,
  children,
  ...rest
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form className={cx(styles.form, className)} {...rest}>
      {children}
    </form>
  )
}

/** Responsive field grid: one column on mobile, two on desktop. */
export function FormGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx(styles.grid, className)}>{children}</div>
}

/** Right-aligned button row (stacks on small screens). */
export function FormActions({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cx(styles.actions, className)}>{children}</div>
}
