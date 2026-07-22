import { api, type QueryParams } from '../../api/client'
import type {
  Grant,
  GrantEditResponse,
  GrantListParams,
  GrantListResponse,
} from './types'

/** GET /avisos/list/ — public, already ordered by nearest phase. */
export function listGrants(
  params: GrantListParams,
  signal?: AbortSignal,
): Promise<GrantListResponse> {
  return api.get<GrantListResponse>(
    '/avisos/list/',
    params as QueryParams,
    signal,
  )
}

/** GET /avisos/<id>/ — public, full detail with collections. */
export function getGrant(id: number, signal?: AbortSignal): Promise<Grant> {
  return api.get<Grant>(`/avisos/${id}/`, undefined, signal)
}

/** PUT /avisos/<id>/edit/ — admin / commercial. Send only changed fields. */
export function editGrant(
  id: number,
  changes: Record<string, unknown>,
): Promise<GrantEditResponse> {
  return api.put<GrantEditResponse>(`/avisos/${id}/edit/`, changes)
}

/** Scrape endpoints (open, no login). Slow — can take minutes. */
export type ScrapeSource = 'compete' | 'portugal' | 'prr' | 'all'

export function scrapeGrants(source: ScrapeSource): Promise<unknown> {
  const path =
    source === 'all' ? '/avisos/' : (`/avisos/${source}/` as const)
  return api.post(path)
}
