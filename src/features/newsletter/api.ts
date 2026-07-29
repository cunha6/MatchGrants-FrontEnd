import { api, type QueryParams } from '../../api/client'
import type {
  PlannedGrantListParams,
  PlannedGrantListResponse,
  SyncResult,
  WeeklyNews,
} from './types'

/** GET /planned-grants/ — paginated list of the annual plan (public). */
export function listPlannedGrants(
  params: PlannedGrantListParams,
  signal?: AbortSignal,
): Promise<PlannedGrantListResponse> {
  return api.get<PlannedGrantListResponse>(
    '/planned-grants/',
    params as QueryParams,
    signal,
  )
}

/** GET /planned-grants/sync/ — resync the annual plan. Slow (download + parse);
 *  a scrape failure comes back as 502 (surfaced as an ApiError). */
export function syncPlannedGrants(): Promise<SyncResult> {
  return api.get<SyncResult>('/planned-grants/sync/')
}

/** GET /news/weekly/ — the weekly newsletter data. */
export function getWeeklyNews(signal?: AbortSignal): Promise<WeeklyNews> {
  return api.get<WeeklyNews>('/news/weekly/', undefined, signal)
}
