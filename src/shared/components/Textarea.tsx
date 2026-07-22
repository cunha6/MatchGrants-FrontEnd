import {
  forwardRef,
  useId,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { FormField } from './FormField'
import styles from './Field.module.css'
import { cx } from '../utils/cx'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, id, className, required, ...rest },
    ref,
  ) {
    const autoId = useId()
    const fieldId = id ?? autoId
    const hintId = hint ? `${fieldId}-hint` : undefined
    const errorId = error ? `${fieldId}-error` : undefined

    const control = (
      <textarea
        ref={ref}
        id={fieldId}
        className={cx(styles.control, styles.textarea, Boolean(error) && styles.invalid, className)}
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
  },
)
