/** Company resolved from the NIF (fields vary; the common ones are typed). */
export interface Company {
  name?: string
  nif?: string
  activity?: string
  cae_codes?: string[] | string
  address?: string
  region?: string
  concelho?: string
  cidade?: string
  nuts_ii?: string
  nuts_iii?: string
  dimension?: string
  entity_type?: string
  [key: string]: unknown
}

export interface EligibilityItem {
  criterion: string
  label: string
  eligible: boolean
}

export interface BreakdownItem {
  criterion: string
  label: string
  matched: boolean
  points: number
}

export interface MatchItem {
  opportunity_id: number
  grant_code: string
  title: string
  score: number
  max_score: number
  /**
   * Combined relevance (0..1) and the primary ordering criterion:
   * 0.60 * sector_similarity + 0.40 * general_similarity.
   * All three are null when the aviso has no embeddings — ordering then falls
   * back to rate + allocation on the API side.
   */
  activity_relevance: number | null
  /** Affinity with the aviso's target sectors (0..1). */
  sector_similarity: number | null
  /** Affinity with the aviso's general content (0..1). */
  general_similarity: number | null
  effective_financing_rate: number | null
  effective_budget_allocation: number | null
  eligibility: EligibilityItem[]
  breakdown: BreakdownItem[]
  /** LLM-based adequacy check for the type of investment/project. */
  llm_adequate: boolean | null
  /** Concrete explanation of the eligible investment/project type when
   *  `llm_adequate` is true (not a generic confirmation otherwise). */
  llm_reason: string | null
}

export interface MatchResponse {
  company: Company
  nif: string
  viewer_user_id: number
  matches: MatchItem[]
}

export interface EvaluateNifPayload {
  nif: string
  cae?: string
  region?: string
  dimension?: string
  entity_type?: string
}

export interface PromoteResponse {
  user_id: number
  nif: string
  role: string
  is_active: boolean
  has_login: boolean
}
