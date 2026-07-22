import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { FormField } from './FormField'
import styles from './Field.module.css'
import { cx } from '../utils/cx'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, required, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  const control = (
    <input
      ref={ref}
      id={fieldId}
      className={cx(styles.control, Boolean(error) && styles.invalid, className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={cx(errorId, hintId) || undefined}
      required={required}
      {...rest}
    />
  )

  if (!label && !hint && !error) return control

  return (
    <FormField
      htmlFor={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      hintId={hintId}
      errorId={errorId}
    >
      {control}
    </FormField>
  )
})
