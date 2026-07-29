export type NoticeStatus = 'active' | 'inactive' | 'to_fix'

/** Enxuto row from GET /anuncios/. */
export interface NoticeListItem {
  id: number
  notice_number: string
  entity_name: string
  description?: string | null
  act_type: string | null
  contract_types: string[]
  base_price: number | null
  proposal_deadline: string | null
  status: NoticeStatus
}

export interface NoticeListResponse {
  total: number
  page: number
  page_size: number
  num_pages: number
  notices: NoticeListItem[]
}

/** GET /anuncios/filters/ — distinct act_type/contract_types values actually
 *  present in browsable (non-expired) anúncios, plus the status options.
 *  Populates the list filters. */
export interface NoticeFilterOptions {
  act_types: string[]
  contract_types: string[]
  statuses: { value: string; label: string }[]
}

export interface NoticeListParams {
  /** Server-side text search over description, entity_name, notice_number. */
  q?: string
  act_type?: string
  procedure_type?: string
  contract_type?: string
  /** 'active' | 'inactive' | 'to_fix'. Omitted = active + to_fix (hides inactive). */
  status?: string
  order_by?: string
  page?: number
  page_size?: number
}

export interface Cpv {
  code?: string
  description?: string
}

export interface LotObject {
  number?: string | number
  title?: string
  description?: string
  base_price?: number | null
  quantity?: number | null
  deadline?: string | null
  [key: string]: unknown
}

/** The API returns each lot either as a plain string (its designation) or as a
 *  {number, title, base_price, …} object. */
export type Lot = LotObject | string

/** Full notice detail (GET /anuncios/<id>/). */
export interface Notice extends NoticeListItem {
  /** "scrape" = last write came from the base.gov.pt import pipeline;
   *  "manual" = a human edit via /edit/ (last_updated_by carries their username). */
  last_update_source?: 'scrape' | 'manual'
  last_updated_by?: string | null
  incm_id?: string | null
  entity_nif?: string | null
  description?: string | null
  procedure_type?: string | null
  cpvs?: Array<Cpv | string> | null
  lots?: Lot[] | null
  url?: string | null
  procedure_documents_url?: string | null
  specifications_path?: string | null
  /** Inline endpoint for the caderno de encargos, or null if no file on disk. */
  specifications_url?: string | null
  program_path?: string | null
  /** Inline endpoint for the programa de concurso, or null if no file on disk. */
  program_url?: string | null
  publication_date?: string | null
  proposal_period_days?: number | null
  dr_number?: string | number | null
  series?: string | number | null
  year?: string | number | null
  environmental_criteria?: boolean | null
}

/** PUT/PATCH /anuncios/<id>/edit/ — mirrors the aviso edit response. */
export interface NoticeEditResponse {
  id: number
  notice_number: string
  /** Fields actually applied. */
  updated: string[]
  /** Fields rejected (outside the server-side whitelist). */
  ignored: string[]
}

export interface ImportSummary {
  created?: number
  updated?: number
  unchanged?: number
  with_keywords?: number
  deactivated_expired?: number
  [key: string]: unknown
}
