import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import styles from './Button.module.css'
import { cx } from '../utils/cx'
import { Spinner } from './Spinner'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md'

interface CommonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

function classesFor(
  { variant = 'primary', size = 'md', fullWidth }: CommonProps,
  extra?: string,
): string {
  return cx(
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    extra,
  )
}

interface ButtonProps
  extends CommonProps,
    ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export function Button({
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  loading = false,
  disabled,
  children,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classesFor({ variant, size, fullWidth }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Spinner
          size={size === 'sm' ? 14 : 16}
          inverse={variant !== 'ghost'}
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

/** A router <Link> styled identically to <Button> (for navigation actions). */
interface ButtonLinkProps extends CommonProps, LinkProps {}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  children,
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <Link className={classesFor({ variant, size, fullWidth }, className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  )
}

/** A plain <a> styled identically to <Button> — for external / file links
 *  (e.g. opening a backend-served PDF in a new tab). */
interface ExternalLinkButtonProps
  extends CommonProps,
    AnchorHTMLAttributes<HTMLAnchorElement> {}

export function ExternalLinkButton({
  variant,
  size,
  fullWidth,
  leftIcon,
  rightIcon,
  children,
  className,
  ...rest
}: ExternalLinkButtonProps) {
  return (
    <a className={classesFor({ variant, size, fullWidth }, className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </a>
  )
}
