import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { FaEye, FaEyeSlash } from 'react-icons/fa'
import { FormField } from './FormField'
import fieldStyles from './Field.module.css'
import styles from './PasswordInput.module.css'
import { cx } from '../utils/cx'

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
}

/** Password field with a show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, hint, error, id, className, required, ...rest }, ref) {
    const [visible, setVisible] = useState(false)
    const autoId = useId()
    const fieldId = id ?? autoId
    const hintId = hint ? `${fieldId}-hint` : undefined
    const errorId = error ? `${fieldId}-error` : undefined

    const control = (
      <div className={styles.wrap}>
        <input
          ref={ref}
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={cx(
            fieldStyles.control,
            styles.input,
            Boolean(error) && fieldStyles.invalid,
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={cx(errorId, hintId) || undefined}
          required={required}
          {...rest}
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
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
