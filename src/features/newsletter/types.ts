import type { Grant } from '../avisos/types'
import type { Notice } from '../anuncios/types'

/** One entry of the Plano Anual (annual plan of upcoming grants).
 *  Same shape as the newsletter's `coming_next_30_days` items. */
export interface PlannedGrant {
  id: number
  plan_id: number
  designation: string
  programme: string | null
  /** Expected opening date (ISO YYYY-MM-DD) or null. */
  expected_start: string | null
  /** Expected closing date (ISO YYYY-MM-DD) or null. */
  expected_end: string | null
  fund: string | null
  /** Budget in euros (number) or null. */
  budget: number | null
  nuts: string | null
}

/** GET /planned-grants/ — paginated, ordered by expected_start asc. */
export interface PlannedGrantListResponse {
  total: number
  page: number
  page_size: number
  num_pages: number
  planned_grants: PlannedGrant[]
}

export interface PlannedGrantListParams {
  page?: number
  page_size?: number
  /** start_earliest (default) | start_latest | end_earliest | end_latest |
   *  allocation_highest | allocation_lowest. Unknown values fall back to
   *  start_earliest. */
  order_by?: string
}

/** GET /planned-grants/sync/ — triggers the (slow) annual-plan sync. */
export interface SyncResult {
  success: boolean
  error?: string
}

/** GET /news/weekly/ — the weekly newsletter payload.
 *  new_* = created in the last 7 days; updated_* = updated in the last 7 days
 *  but created before that. Grant/Notice items are the full detail objects. */
export interface WeeklyNews {
  generated_at: string
  new_grants: Grant[]
  updated_grants: Grant[]
  new_notices: Notice[]
  updated_notices: Notice[]
  coming_next_30_days: PlannedGrant[]
}
