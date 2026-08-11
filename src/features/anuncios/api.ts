import { api, buildQuery, type QueryParams } from '../../api/client'
import type {
  ImportSummary,
  Notice,
  NoticeAiDetailResponse,
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

/**
 * POST /anuncios/<id>/detail/ — AI reading of the caderno de encargos.
 * Non-blocking: this request never waits for the AI. It answers with either
 * `{ status: 'generating' }` (202 — background generation just kicked off, or
 * was already running) or the ready `{ status: 'done', ... }` (200 — cached,
 * or the background job just finished). Callers must poll on 'generating'.
 *
 * POST (not GET) because it has side effects: it may kick off that background
 * job. Only fire it on an explicit user action — never on render. Once done,
 * it's cheap (server-cached) and safe to call again anytime.
 *
 * `refresh` bypasses the cache and forces regeneration — not wired to any UI
 * trigger right now (there's no "Regenerar" button), kept for when there is.
 *
 * 404 means "no caderno de encargos available for this anúncio", not a missing
 * route — surface it as an explanation, not a generic error.
 */
export function getNoticeAiDetail(
  id: number,
  refresh = false,
): Promise<NoticeAiDetailResponse> {
  const path = `/anuncios/${id}/detail/${buildQuery(refresh ? { refresh: true } : undefined)}`
  return api.post<NoticeAiDetailResponse>(path)
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
