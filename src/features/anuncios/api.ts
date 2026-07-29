import { api, buildQuery, type QueryParams } from '../../api/client'
import type {
  ImportSummary,
  Notice,
  NoticeEditResponse,
  NoticeFilterOptions,
  NoticeListParams,
  NoticeListResponse,
} from './types'

/** GET /anuncios/list/ — public, enxuto. */
export function listNotices(
  params: NoticeListParams,
  signal?: AbortSignal,
): Promise<NoticeListResponse> {
  return api.get<NoticeListResponse>(
    '/anuncios/list/',
    params as QueryParams,
    signal,
  )
}

/** GET /anuncios/filters/ — distinct act_type/contract_types values to
 *  populate the list filters (only values that actually match something). */
export function getNoticeFilters(signal?: AbortSignal): Promise<NoticeFilterOptions> {
  return api.get<NoticeFilterOptions>('/anuncios/filters/', undefined, signal)
}

/** GET /anuncios/<id>/ — public, full detail. */
export function getNotice(id: number, signal?: AbortSignal): Promise<Notice> {
  return api.get<Notice>(`/anuncios/${id}/`, undefined, signal)
}

/** PUT /anuncios/<id>/edit/ — admin / commercial. Send only changed fields. */
export function editNotice(
  id: number,
  changes: Record<string, unknown>,
): Promise<NoticeEditResponse> {
  return api.put<NoticeEditResponse>(`/anuncios/${id}/edit/`, changes)
}

/** POST /anuncios/[?num_days=<n>] — open, slow. Imports last `days` days. */
export function importNotices(days?: number): Promise<ImportSummary> {
  const path = `/anuncios/${buildQuery(days ? { num_days: days } : undefined)}`
  return api.post<ImportSummary>(path)
}
