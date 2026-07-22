/** Enxuto row from GET /avisos/list/. */
export interface GrantListItem {
  id: number
  grant_code: string
  title: string
  closing_date: string | null
  total_allocation: number | null
  financing_rate: number | null
  next_phase_date: string | null
  active: boolean
}

export interface GrantListResponse {
  total: number
  page: number
  page_size: number
  num_pages: number
  grants: GrantListItem[]
}

export interface GrantListParams {
  active?: 'true' | 'false' | 'all'
  publication_from?: string
  publication_to?: string
  closing_from?: string
  closing_to?: string
  allocation_min?: number
  allocation_max?: number
  rate_min?: number
  rate_max?: number
  page?: number
  page_size?: number
  order_by?: string
}

/* ---- Detail collections (GET /avisos/<id>/) ---- */
export interface Phase {
  name?: string
  start_date?: string | null
  end_date?: string | null
  access_condition?: string | null
}

export interface DistributionItem {
  name?: string
  budget?: string | number | null
}

export interface PhaseArea {
  phase_id?: number
  /** Foreign key into covered_areas[].id — resolves to a geographic_area. */
  area_id?: number
  fund_name?: string
  budget_allocation?: number | null
  max_financing_rate?: number | null
  /** Either a free-text string or a per-segment [{name, budget}] breakdown. */
  distribution?: string | DistributionItem[] | null
}

export interface LegislationArticle {
  article?: string
  refers_to?: string | null
}

export interface LegislationEntry {
  regulation_name?: string
  refers_to?: string | null
  articles?: LegislationArticle[]
}

export interface FinancingRateRow {
  company_size?: string
  base_rate?: number | null
  max_global_rate?: number | null
  [key: string]: unknown
}

export interface ExpenseGroup {
  category?: string
  items?: string[] | string
}

/** The API returns expenses either as plain strings or {category, items} objects. */
export type ExpenseEntry = ExpenseGroup | string

export interface GrantDocument {
  doc_type?: string
  name?: string
  url?: string
  is_canonical?: boolean
  local?: boolean
}

/** Recursive: a criterion may nest sub-criteria (A → A1 → A2.1 …). */
export interface EvaluationCriterion {
  criterion_name?: string
  description?: string
  formula?: string | null
  weight?: number | null
  min_score?: number | null
  is_exclusion_criterion?: boolean
  subcriteria?: EvaluationCriterion[] | null
}

export interface EvaluationMethodology {
  project_merit_formula?: string | null
  min_global_score?: number | null
  /** Free-text scale description ("1-Muito Insuficiente: …; 2-…"). */
  scoring_scale?: string | Array<Record<string, unknown>> | null
  evaluation_criteria?: EvaluationCriterion[]
  tiebreaker_criteria?: string[]
}

export interface NonCompliancePenalty {
  rule_description?: string | null
  indicator_types?: string | null
  max_penalty_percentage?: number | null
  compliance_grade_formula?: string | null
  penalty_tiers?: Array<Record<string, unknown>>
}

export interface ExpenseLimit {
  expense_category?: string
  applicable_ocs_methodology?: string | null
  /** Absolute cap in € (e.g. 300000). */
  max_absolute_value?: number | null
  /** Relative cap in % (e.g. 20). */
  max_percentage_value?: number | null
  calculation_base?: string | null
  specific_conditions?: string | null
}

export interface Indicator {
  indicator_code?: string
  description?: string
  unit_of_measure?: string | null
  target?: number | string | null
  calculation_method?: string | null
}

export interface ApplicationDocument {
  name?: string
  mandatory?: boolean
  document_type?: string
}

export interface BeneficiaryByAction {
  action_type?: string
  entities?: string[]
}

export interface CoveredArea {
  id?: number
  geographic_area?: string
  [key: string]: unknown
}

/** Full grant detail. Documented fields are typed; the well-known collections
 *  are typed too. Anything the backend adds beyond this is simply not rendered. */
export interface Grant extends GrantListItem {
  financing_program?: string | null
  managing_entity?: string | null
  publication_date?: string | null
  opening_date?: string | null
  minimum_investment?: number | null
  maximum_investment?: number | null
  maximum_self_financing?: number | null
  objective?: string | null
  specific_objective?: string | null
  operation_typology?: string | null
  included_caes?: string[] | string | null
  excluded_caes?: string[] | string | null
  eligible_regions?: string[] | string | null
  beneficiary_eligibility_criteria?: string[] | string | null
  final_recipients?: string[] | string | null
  state_aid_regime?: string | null
  /** Inline-PDF endpoint for the aviso itself, or null if no file on disk. */
  document_url?: string | null

  absolute_execution_deadline?: string | null
  amendment_date?: string | null
  applicable_gber_article?: string | null
  application_submission?: string | null
  bonus_mechanisms?: string[] | null
  communication_obligations?: string[] | null
  dnsh_criteria?: string | null
  dnsh_principle?: string | null
  expense_eligibility_start_date?: string | null
  /** Shape varies by grant (strings or {deadline,description,target_percentage}
   *  objects) — edited as raw JSON rather than a typed structure. */
  financial_execution_targets?: unknown
  fund_name?: string | null
  /** Array of {name, tax_id, competencies} — edited as raw JSON. */
  intermediate_bodies?: unknown
  intervention_type_code?: string | null
  low_density_territories?: string[] | null
  max_duration_months?: number | null
  notice_modality?: string | null
  program_priority?: string | null
  project_selection_criteria?: string[] | null
  submission_limits?: string | null
  target_technology_sectors?: string[] | null

  phases?: Phase[]
  covered_areas?: CoveredArea[]
  phase_areas?: PhaseArea[]
  financing_rates?: FinancingRateRow[]
  eligible_expenses?: ExpenseEntry[]
  ineligible_expenses?: ExpenseEntry[]
  expense_limits?: ExpenseLimit[]
  non_compliance_penalties?: NonCompliancePenalty[]
  evaluation_methodologies?: EvaluationMethodology[]
  beneficiaries_by_action?: BeneficiaryByAction[]
  documents?: GrantDocument[]
  /** Regenerated by the backend — read-only in the editor. */
  annex_documents?: unknown[]
  /** Regenerated on each AI extraction — read-only in the editor. */
  applicable_legislation?: Array<LegislationEntry | string>
  /** Flag toggled by reviewers. */
  needs_review?: boolean

  /* text blocks (string or string[]) */
  covered_actions?: string | string[] | null
  admissibility_conditions?: string | string[] | null
  commitment_requirements?: string | string[] | null
  payment_methods?: string | string[] | null
  beneficiary_obligations?: string | string[] | null
  contact?: string | string[] | null

  /* indicators */
  output_indicators?: Indicator[]
  result_indicators?: Indicator[]
  monitoring_indicators?: Indicator[]

  application_documents?: ApplicationDocument[]
}

export interface GrantEditResponse {
  id: number
  grant_code: string
  updated: string[]
  ignored: string[]
  /** Which collections were replaced (e.g. ["financing_rates","phase_areas"]). */
  collections_updated?: string[]
  /** Recomputed from financing_rates — only present when collections changed. */
  financing_rate?: number
}
