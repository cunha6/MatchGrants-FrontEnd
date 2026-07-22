import type { ReactNode } from 'react'
import styles from './Field.module.css'
import { cx } from '../utils/cx'

interface FormFieldProps {
  htmlFor?: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  hintId?: string
  errorId?: string
  children: ReactNode
  className?: string
}

/**
 * Layout wrapper: label + control + hint/error. Used directly for custom
 * controls (radio groups etc.); Input/Select/Textarea wrap it automatically.
 */
export function FormField({
  htmlFor,
  label,
  hint,
  error,
  required,
  hintId,
  errorId,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cx(styles.field, className)}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
