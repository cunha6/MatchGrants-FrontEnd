import { api, type QueryParams } from '../../api/client'
import type {
  ImportSummary,
  Notice,
  NoticeEditResponse,
  NoticeListParams,
  NoticeListResponse,
} from './types'

/** GET /anuncios/ — public, enxuto. */
export function listNotices(
  params: NoticeListParams,
  signal?: AbortSignal,
): Promise<NoticeListResponse> {
  return api.get<NoticeListResponse>(
    '/anuncios/',
    params as QueryParams,
    signal,
  )
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

/** POST /anuncios/importar/[<n>/] — open, slow. Imports last `days` days. */
export function importNotices(days?: number): Promise<ImportSummary> {
  const path = days ? `/anuncios/importar/${days}/` : '/anuncios/importar/'
  return api.post<ImportSummary>(path)
}
