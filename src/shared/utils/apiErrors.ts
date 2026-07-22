import { ApiError } from '../../api/client'

/**
 * Normalise the `details` payload of a 400 response into a flat
 * { field: message } map so forms can show inline errors. Handles both
 * { field: "msg" } and { field: ["msg", ...] } shapes.
 */
export function fieldErrorsFrom(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {}
  const details = error.details
  if (!details || typeof details !== 'object') return {}
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (Array.isArray(value)) out[key] = String(value[0])
    else if (value != null) out[key] = String(value)
  }
  return out
}

/** The top-level message plus a compact summary of any field errors. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro.'
  }
  return error.message
}
