/**
 * Presentation helpers — currency (€), percentages, dates and numbers.
 * All formatting for pt-PT lives here so screens stay consistent.
 */

const NUMBER_FMT = new Intl.NumberFormat('pt-PT')
const CURRENCY_FMT = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})
const CURRENCY_FMT_CENTS = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const DATE_FMT = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const DATETIME_FMT = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const EMPTY = '—'

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** "677 126 €". Pass { cents: true } for two decimals. */
export function formatCurrency(
  value: unknown,
  opts: { cents?: boolean } = {},
): string {
  const n = toNumber(value)
  if (n === null) return EMPTY
  return (opts.cents ? CURRENCY_FMT_CENTS : CURRENCY_FMT).format(n)
}

/** "60%". Accepts 60 (already a percentage) — the API returns whole percents. */
export function formatPercent(value: unknown): string {
  const n = toNumber(value)
  if (n === null) return EMPTY
  const rounded = Math.round(n * 100) / 100
  return `${NUMBER_FMT.format(rounded)}%`
}

export function formatNumber(value: unknown): string {
  const n = toNumber(value)
  if (n === null) return EMPTY
  return NUMBER_FMT.format(n)
}

function parseDate(value: unknown): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

/** "31 jul 2026" */
export function formatDate(value: unknown): string {
  const d = parseDate(value)
  return d ? DATE_FMT.format(d) : EMPTY
}

/** "31 jul 2026, 17:00" */
export function formatDateTime(value: unknown): string {
  const d = parseDate(value)
  return d ? DATETIME_FMT.format(d) : EMPTY
}

/**
 * Whole days from now until `value` (negative when past).
 * Used for the deadline "days remaining" ring/pill.
 */
export function daysUntil(value: unknown): number | null {
  const d = parseDate(value)
  if (!d) return null
  const ONE_DAY = 86_400_000
  return Math.ceil((d.getTime() - Date.now()) / ONE_DAY)
}

/** Render any value that might be null/empty with the em-dash fallback. */
export function orDash(value: unknown): string {
  if (value === null || value === undefined || value === '') return EMPTY
  return String(value)
}
