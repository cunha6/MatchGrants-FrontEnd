/**
 * Normalise a value that may arrive as an array, a delimited string, or null
 * into a clean string[]. Used for CAE/region fields that the API returns in
 * different shapes.
 */
export function toStringArray(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return [String(value)]
}

/** Turn a snake_case / camelCase key into a human label ("fund_name" → "Fund name"). */
export function humanizeKey(key: string): string {
  const spaced = key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

/**
 * Normalise a string | string[] text block into a list of paragraphs/items —
 * without splitting a single long string (unlike toStringArray).
 */
export function toList(value: string | string[] | null | undefined): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return value.map(String).filter((s) => s.trim())
  return String(value).trim() ? [String(value)] : []
}

/** True for values worth rendering (skips null/empty/empty-array). */
export function hasValue(value: unknown): boolean {
  if (value == null || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  return true
}
