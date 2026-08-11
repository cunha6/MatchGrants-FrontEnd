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
  /** AI reading of the caderno de encargos — optional here defensively, but
   *  the API always sends it (status 'pending' with empty content until
   *  someone triggers generation via POST .../detail/). */
  ai_detail?: NoticeAiDetailState
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

/** The AI reading itself — shared by the embedded state on Notice and the
 *  POST 200 response. Every field can come back empty ("" / []) when the
 *  document doesn't carry that information (or generation hasn't run yet). */
export interface NoticeAiContent {
  descricao_detalhada: string
  /**
   * One sentence describing the evaluation model, e.g. "Multifator –
   * Proposta economicamente mais vantajosa: Preço (30%) + …". A few exact
   * strings are worth matching on if UI logic ever needs them:
   * - "Monofator – Preço mais baixo (100%)" — price is the only criterion.
   * - "Não foi possível identificar os critérios de avaliação no documento."
   * - "" — not generated yet (status != 'done').
   */
  avaliacao: string
  /** One note per item; [] when there's nothing to flag. */
  observacoes: string[]
}

export type NoticeAiStatus = 'pending' | 'generating' | 'done' | 'error'

/** Notice.ai_detail (GET /anuncios/<id>/) — visible to anyone who can see the
 *  anúncio, regardless of role. Content fields are only meaningful once
 *  `status` is 'done'; otherwise they're empty placeholders. */
export interface NoticeAiDetailState extends NoticeAiContent {
  status: NoticeAiStatus
}

/** POST /anuncios/<id>/detail/ while the background generation hasn't
 *  finished (or hasn't started) yet — keep polling the same endpoint. */
export interface NoticeAiDetailGenerating {
  status: 'generating'
}

/** POST /anuncios/<id>/detail/ once the AI reading is ready — either it was
 *  already cached, or the background generation just finished. */
export interface NoticeAiDetail extends NoticeAiContent {
  status: 'done'
}

/** 202 while generating, 200 once done — same endpoint, poll it. */
export type NoticeAiDetailResponse = NoticeAiDetailGenerating | NoticeAiDetail

export interface ImportSummary {
  created?: number
  updated?: number
  unchanged?: number
  with_keywords?: number
  deactivated_expired?: number
  [key: string]: unknown
}
