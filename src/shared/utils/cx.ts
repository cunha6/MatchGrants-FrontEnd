/**
 * Tiny className joiner — filters out falsy values so conditional classes read
 * cleanly: cx(styles.btn, isActive && styles.active).
 */
export function cx(
  ...values: Array<string | number | bigint | boolean | null | undefined>
): string {
  return values
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .join(' ')
}
