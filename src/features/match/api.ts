import { api } from '../../api/client'
import type { EvaluateNifPayload, MatchResponse, PromoteResponse } from './types'

/**
 * POST /match/evaluate-nif/ — open, slow (can take minutes).
 * On 422 the ApiError carries `needsMoreInfo` + `missingFields` so the UI can
 * ask for the extra company data and resend.
 */
export function evaluateNif(
  payload: EvaluateNifPayload,
  signal?: AbortSignal,
): Promise<MatchResponse> {
  return api.post<MatchResponse>('/match/evaluate-nif/', payload, signal)
}

/** POST /match/promote/<nif>/ — admin / commercial. */
export function promoteViewer(nif: string): Promise<PromoteResponse> {
  return api.post<PromoteResponse>(`/match/promote/${encodeURIComponent(nif)}/`)
}
