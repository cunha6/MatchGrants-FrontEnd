import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { editGrant, getGrant } from '../api'
import type { Grant } from '../types'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  Alert,
  Button,
  ButtonLink,
  Card,
  ErrorState,
  Form,
  FormActions,
  FormGrid,
  Input,
  LoadingBlock,
  PageHeader,
  Select,
  Textarea,
} from '../../../shared/components'
import { CollectionEditor } from '../components/StructEditor'
import { formatPercent } from '../../../shared/utils/format'
import { fieldErrorsFrom } from '../../../shared/utils/apiErrors'
import { ApiError } from '../../../api/client'
import detail from '../../../shared/styles/detail.module.css'

/**
 * - text/number/date: a single scalar value.
 * - textarea: a single long string (no splitting).
 * - list: ALWAYS an array of strings — one per line, trimmed, empties dropped.
 *   Used for fields the API always returns as an array.
 * - adaptive: string OR string[] depending on the aviso — the API stores the
 *   same field as a single paragraph on some avisos and as an item array on
 *   others. One line on submit → sent as a string; 2+ lines → sent as an array.
 * - collection: nested records, edited as attribute/value fields (CollectionEditor).
 *   The value is held as-is (not stringified) and diffed structurally.
 * - bool: a true/false select.
 * - readonly: shown but never editable and never sent (the API regenerates it
 *   and returns it in `ignored`): id, annex_documents, applicable_legislation.
 */
type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'list'
  | 'adaptive'
  | 'collection'
  | 'bool'
  | 'readonly'
interface FieldDef {
  key: keyof Grant
  label: string
  kind: FieldKind
  full?: boolean
  section?: string
  /** Explanatory note shown under a read-only field. */
  note?: string
}

const FIELDS: FieldDef[] = [
  // --- Identificação ---
  { key: 'grant_code', label: 'Código', kind: 'text', section: 'Identificação' },
  { key: 'financing_program', label: 'Programa de financiamento', kind: 'text' },
  { key: 'fund_name', label: 'Fundo', kind: 'text' },
  { key: 'managing_entity', label: 'Entidade gestora', kind: 'text' },
  { key: 'notice_modality', label: 'Modalidade do aviso', kind: 'text' },
  { key: 'intervention_type_code', label: 'Código de tipologia de intervenção', kind: 'text' },
  { key: 'operation_typology', label: 'Tipologia de operação', kind: 'text' },
  { key: 'program_priority', label: 'Prioridade do programa', kind: 'text' },
  { key: 'title', label: 'Título', kind: 'textarea', full: true },

  // --- Datas ---
  { key: 'publication_date', label: 'Data de publicação', kind: 'date', section: 'Datas' },
  { key: 'opening_date', label: 'Data de abertura', kind: 'date' },
  { key: 'closing_date', label: 'Data de encerramento', kind: 'date' },
  { key: 'amendment_date', label: 'Data de retificação', kind: 'date' },
  { key: 'absolute_execution_deadline', label: 'Prazo absoluto de execução', kind: 'date' },
  {
    key: 'expense_eligibility_start_date',
    label: 'Início da elegibilidade de despesa',
    kind: 'text',
  },
  { key: 'max_duration_months', label: 'Duração máxima (meses)', kind: 'number' },

  // --- Financeiro ---
  { key: 'total_allocation', label: 'Dotação total (€)', kind: 'number', section: 'Financeiro' },
  {
    key: 'financing_rate',
    label: 'Taxa de financiamento (%)',
    kind: 'number'
  },
  { key: 'minimum_investment', label: 'Investimento mínimo (€)', kind: 'number' },
  { key: 'maximum_investment', label: 'Investimento máximo (€)', kind: 'number' },
  { key: 'maximum_self_financing', label: 'Autofinanciamento máx. (%)', kind: 'number' },
  { key: 'state_aid_regime', label: 'Regime de auxílio', kind: 'text' },
  { key: 'applicable_gber_article', label: 'Artigo GBER aplicável', kind: 'text' },
  { key: 'submission_limits', label: 'Limites de submissão', kind: 'text' },

  // --- Objetivo e âmbito ---
  { key: 'objective', label: 'Objetivo', kind: 'textarea', full: true, section: 'Objetivo e âmbito' },
  { key: 'specific_objective', label: 'Objetivo específico', kind: 'textarea', full: true },
  { key: 'covered_actions', label: 'Ações abrangidas', kind: 'adaptive', full: true },
  {
    key: 'target_technology_sectors',
    label: 'Setores / tecnologias-alvo',
    kind: 'list',
    full: true,
  },

  // --- Elegibilidade ---
  { key: 'eligible_regions', label: 'Regiões elegíveis', kind: 'list', section: 'Elegibilidade' },
  { key: 'low_density_territories', label: 'Territórios de baixa densidade', kind: 'list' },
  { key: 'included_caes', label: 'CAE incluídos', kind: 'list' },
  { key: 'excluded_caes', label: 'CAE excluídos', kind: 'list' },
  {
    key: 'beneficiary_eligibility_criteria',
    label: 'Critérios de elegibilidade dos beneficiários',
    kind: 'adaptive',
    full: true,
  },
  { key: 'final_recipients', label: 'Destinatários finais', kind: 'adaptive', full: true },
  {
    key: 'admissibility_conditions',
    label: 'Condições de admissibilidade',
    kind: 'adaptive',
    full: true,
  },
  { key: 'dnsh_principle', label: 'Princípio DNSH', kind: 'textarea', full: true },
  { key: 'dnsh_criteria', label: 'Critérios DNSH', kind: 'textarea', full: true },

  // --- Candidatura e gestão ---
  {
    key: 'application_submission',
    label: 'Como se candidatar',
    kind: 'textarea',
    full: true,
    section: 'Candidatura e gestão',
  },
  {
    key: 'project_selection_criteria',
    label: 'Critérios de seleção do projeto',
    kind: 'list',
    full: true,
  },
  { key: 'commitment_requirements', label: 'Calendário / prazos de decisão', kind: 'textarea', full: true },
  { key: 'payment_methods', label: 'Formas de pagamento', kind: 'adaptive', full: true },
  { key: 'beneficiary_obligations', label: 'Obrigações do beneficiário', kind: 'adaptive', full: true },
  {
    key: 'communication_obligations',
    label: 'Obrigações de comunicação',
    kind: 'list',
    full: true,
  },
  { key: 'bonus_mechanisms', label: 'Mecanismos de bonificação', kind: 'list', full: true },
  { key: 'contact', label: 'Contactos', kind: 'list', full: true },
  { key: 'needs_review', label: 'Precisa de revisão', kind: 'bool' },

  // --- Coleções (registos aninhados) ---
  {
    key: 'intermediate_bodies',
    label: 'Organismos intermédios',
    kind: 'collection',
    full: true,
    section: 'Coleções',
  },
  { key: 'financial_execution_targets', label: 'Metas de execução financeira', kind: 'collection', full: true },
  { key: 'phases', label: 'Fases', kind: 'collection', full: true },
  { key: 'phase_areas', label: 'Dotações por área/fundo', kind: 'collection', full: true },
  { key: 'financing_rates', label: 'Taxas por dimensão', kind: 'collection', full: true },
  { key: 'eligible_expenses', label: 'Despesas elegíveis', kind: 'collection', full: true },
  { key: 'ineligible_expenses', label: 'Despesas não elegíveis', kind: 'collection', full: true },
  { key: 'expense_limits', label: 'Limites de despesa', kind: 'collection', full: true },
  { key: 'evaluation_methodologies', label: 'Metodologias de avaliação', kind: 'collection', full: true },
  { key: 'non_compliance_penalties', label: 'Penalizações por incumprimento', kind: 'collection', full: true },
  { key: 'output_indicators', label: 'Indicadores de realização', kind: 'collection', full: true },
  { key: 'result_indicators', label: 'Indicadores de resultado', kind: 'collection', full: true },
  { key: 'monitoring_indicators', label: 'Indicadores de acompanhamento', kind: 'collection', full: true },
  { key: 'beneficiaries_by_action', label: 'Beneficiários por ação', kind: 'collection', full: true },
  { key: 'covered_areas', label: 'Áreas geográficas abrangidas', kind: 'collection', full: true },
]

/** Split a textarea's lines into trimmed, non-empty items. */
function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Render a scalar/list value as the initial textarea text. */
function toInitialText(raw: unknown, kind: FieldKind): string {
  if (raw == null) return ''
  if (kind === 'list' || kind === 'adaptive') {
    return Array.isArray(raw) ? raw.map(String).join('\n') : String(raw)
  }
  return String(raw)
}

/** Text-backed fields (everything except collections and read-only fields). */
function toInitial(grant: Grant): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of FIELDS) {
    if (f.kind === 'collection' || f.kind === 'readonly') continue
    const raw = grant[f.key]
    if (f.kind === 'date') out[f.key as string] = raw ? String(raw).slice(0, 10) : ''
    else if (f.kind === 'bool') out[f.key as string] = raw ? 'true' : 'false'
    else out[f.key as string] = toInitialText(raw, f.kind)
  }
  out.active = grant.active ? 'true' : 'false'
  return out
}

/** Collections keep their real shape — they're edited as fields, not text. */
function toInitialCollections(grant: Grant): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of FIELDS) {
    if (f.kind !== 'collection') continue
    const raw = grant[f.key]
    out[f.key as string] = Array.isArray(raw) ? raw : []
  }
  return out
}

export function AvisoEdit() {
  const { id } = useParams<{ id: string }>()
  const grantId = Number(id)

  const { data: grant, loading, error, reload } = useApiQuery(
    (signal) => getGrant(grantId, signal),
    [grantId],
  )

  return (
    <div>
      <Link to={`/avisos/${grantId}`} className={detail.back}>
        ← Voltar ao aviso
      </Link>
      <PageHeader
        eyebrow="Edição"
        title="Editar aviso"
        description="Só os campos alterados são enviados para a API."
      />
      {loading ? (
        <LoadingBlock message="A carregar aviso…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : grant ? (
        <EditForm grant={grant} />
      ) : null}
    </div>
  )
}

/** Non-editable field: shown for reference, never sent to the API. */
function ReadOnlyField({
  label,
  value,
  note = 'Só leitura — não editável.',
  display,
}: {
  label: string
  value: unknown
  note?: string
  /** Overrides the default value rendering (e.g. pre-formatted number). */
  display?: string
}) {
  const summary =
    display ??
    (Array.isArray(value)
      ? `${value.length} ${value.length === 1 ? 'registo' : 'registos'}`
      : value == null || value === ''
        ? '—'
        : String(value))
  return (
    <div>
      <span
        style={{
          display: 'block',
          marginBottom: 'var(--space-1)',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 'var(--font-weight-medium)',
        }}
      >
        {label}
      </span>
      <div
        style={{
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-surface-3)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        {summary}
      </div>
      <span
        style={{
          display: 'block',
          marginTop: 'var(--space-1)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-subtle)',
        }}
      >
        {note}
      </span>
    </div>
  )
}

function EditForm({ grant }: { grant: Grant }) {
  const navigate = useNavigate()
  const initial = useMemo(() => toInitial(grant), [grant])
  const initialCollections = useMemo(() => toInitialCollections(grant), [grant])
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [collections, setCollections] = useState<Record<string, unknown>>(initialCollections)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const buildChanges = (): Record<string, unknown> => {
    const changes: Record<string, unknown> = {}

    for (const f of FIELDS) {
      const key = f.key as string

      // Never sent — the backend regenerates these and returns them in `ignored`.
      if (f.kind === 'readonly') continue

      if (f.kind === 'collection') {
        // Plain JSON values — a structural compare is enough to spot edits.
        if (JSON.stringify(collections[key]) !== JSON.stringify(initialCollections[key])) {
          changes[key] = collections[key]
        }
        continue
      }

      if (values[key] === initial[key]) continue
      const val = values[key]

      if (f.kind === 'number') {
        changes[key] = val === '' ? null : Number(val)
      } else if (f.kind === 'date') {
        changes[key] = val === '' ? null : val
      } else if (f.kind === 'bool') {
        changes[key] = val === 'true'
      } else if (f.kind === 'list') {
        changes[key] = linesOf(val)
      } else if (f.kind === 'adaptive') {
        const lines = linesOf(val)
        changes[key] = lines.length <= 1 ? val.trim() : lines
      } else {
        changes[key] = val
      }
    }

    if (values.active !== initial.active) changes.active = values.active === 'true'
    return changes
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneral(null)
    setErrors({})

    const changes = buildChanges()
    if (Object.keys(changes).length === 0) {
      setGeneral('Não há alterações para gravar.')
      return
    }

    setSubmitting(true)
    try {
      const res = await editGrant(grant.id, changes)
      // Leave the edit view and confirm on the detail page (flash message).
      navigate(`/avisos/${grant.id}`, {
        state: {
          flash: {
            updated: res.updated ?? [],
            ignored: res.ignored ?? [],
            collectionsUpdated: res.collections_updated ?? [],
            financingRate: res.financing_rate ?? null,
          },
        },
      })
    } catch (err) {
      setErrors(fieldErrorsFrom(err))
      setGeneral(
        err instanceof ApiError ? err.message : 'Não foi possível gravar as alterações.',
      )
      setSubmitting(false)
    }
  }

  const rowStyle = (full?: boolean) => (full ? { gridColumn: '1 / -1' } : undefined)

  return (
    <Card>
      <Form onSubmit={onSubmit} noValidate>
        {general && <Alert variant="danger">{general}</Alert>}

        <FormGrid>
          {FIELDS.map((f, i) => {
            const key = f.key as string
            const showHeading = Boolean(f.section) && f.section !== FIELDS[i - 1]?.section

            const common = {
              label: f.label,
              value: values[key],
              error: errors[key],
              onChange: set(key),
            }

            let control: React.ReactNode
            if (f.kind === 'readonly') {
              const raw = grant[f.key]
              control = (
                <ReadOnlyField
                  label={f.label}
                  value={raw}
                  note={f.note}
                  display={
                    f.key === 'financing_rate' && raw != null
                      ? formatPercent(raw as number)
                      : undefined
                  }
                />
              )
            } else if (f.kind === 'bool') {
              control = (
                <Select
                  {...common}
                  options={[
                    { value: 'true', label: 'Sim' },
                    { value: 'false', label: 'Não' },
                  ]}
                />
              )
            } else if (f.kind === 'collection') {
              control = (
                <CollectionEditor
                  label={f.label}
                  value={collections[key]}
                  onChange={(next) => setCollections((c) => ({ ...c, [key]: next }))}
                />
              )
            } else if (f.kind === 'list') {
              control = <Textarea {...common} hint="Um item por linha" rows={4} />
            } else if (f.kind === 'adaptive') {
              control = (
                <Textarea
                  {...common}
                  hint="Uma linha = texto único; várias linhas = lista"
                  rows={4}
                />
              )
            } else if (f.kind === 'textarea') {
              control = <Textarea {...common} rows={f.key === 'title' ? 2 : 4} />
            } else {
              control = (
                <Input
                  {...common}
                  type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'}
                />
              )
            }

            return (
              <div key={key} style={{ display: 'contents' }}>
                {showHeading && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ margin: 'var(--space-5) 0 var(--space-2)' }}>{f.section}</h3>
                  </div>
                )}
                <div style={rowStyle(f.full)}>{control}</div>
              </div>
            )
          })}
          <div style={{ gridColumn: '1 / -1' }}>
            <Select
              label="Estado"
              value={values.active}
              onChange={set('active')}
              options={[
                { value: 'true', label: 'Ativo' },
                { value: 'false', label: 'Inativo' },
              ]}
            />
          </div>
        </FormGrid>

        <FormActions>
          <ButtonLink to={`/avisos/${grant.id}`} variant="ghost">
            Cancelar
          </ButtonLink>
          <Button type="submit" loading={submitting}>
            Gravar alterações
          </Button>
        </FormActions>
      </Form>
    </Card>
  )
}
