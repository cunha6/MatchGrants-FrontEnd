import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { FormField } from './FormField'
import styles from './Field.module.css'
import { cx } from '../utils/cx'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  options?: SelectOption[]
  /** Optional leading placeholder option. */
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, id, className, required, options, placeholder, children, ...rest },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined

  const control = (
    <select
      ref={ref}
      id={fieldId}
      className={cx(styles.control, Boolean(error) && styles.invalid, className)}
      aria-invalid={error ? true : undefined}
      aria-describedby={cx(errorId, hintId) || undefined}
      required={required}
      {...rest}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options
        ? options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        : children}
    </select>
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
