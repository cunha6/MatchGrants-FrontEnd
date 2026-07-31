import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import styles from './Checkbox.module.css'
import { cx } from '../utils/cx'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  error?: ReactNode
}

/** Labelled checkbox — the label sits beside the box, not above it like Input. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, className, required, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const errorId = error ? `${fieldId}-error` : undefined

  return (
    <div className={cx(styles.field, className)}>
      <label className={styles.row} htmlFor={fieldId}>
        <input
          ref={ref}
          id={fieldId}
          type="checkbox"
          className={styles.box}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          required={required}
          {...rest}
        />
        <span className={styles.label}>{label}</span>
      </label>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  )
})
