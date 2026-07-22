import styles from './Spinner.module.css'
import { cx } from '../utils/cx'

interface SpinnerProps {
  /** Diameter in px. Defaults to 20. */
  size?: number
  /** Render on a dark surface (uses inverse colour). */
  inverse?: boolean
  className?: string
  label?: string
}

/** Accessible loading indicator. */
export function Spinner({
  size = 20,
  inverse = false,
  className,
  label = 'A carregar…',
}: SpinnerProps) {
  return (
    <span
      className={cx(styles.spinner, inverse && styles.inverse, className)}
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 10) }}
      role="status"
      aria-label={label}
    />
  )
}

/** Centered spinner + message for full-section loading states. */
export function LoadingBlock({ message = 'A carregar…' }: { message?: string }) {
  return (
    <div className={styles.block} role="status">
      <Spinner size={28} />
      <span>{message}</span>
    </div>
  )
}
