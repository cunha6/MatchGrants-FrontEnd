import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { editNotice, getNotice } from '../api'
import type { Notice } from '../types'
import { NOTICE_STATUS_LABELS } from '../../../shared/constants/domain'
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
import { fieldErrorsFrom } from '../../../shared/utils/apiErrors'
import { ApiError } from '../../../api/client'
import detail from '../../../shared/styles/detail.module.css'

/**
 * - text/number/date: a single scalar value.
 * - textarea: a single long string.
 * - list: an array of strings — one per line, trimmed, empties dropped.
 *   (contract_types / cpvs / lots come back as plain string arrays.)
 * - bool: a true/false select.
 * - status: the active/inactive/to_fix select.
 * `id` and the derived `specifications_url` are not editable.
 */
type FieldKind = 'text' | 'textarea' | 'number' | 'date' | 'list' | 'bool' | 'status'
interface FieldDef {
  key: keyof Notice
  label: string
  kind: FieldKind
  full?: boolean
  section?: string
}

const FIELDS: FieldDef[] = [
  // --- Identificação ---
  { key: 'notice_number', label: 'N.º de anúncio', kind: 'text', section: 'Identificação' },
  { key: 'incm_id', label: 'ID INCM', kind: 'text' },
  { key: 'entity_name', label: 'Entidade', kind: 'text' },
  { key: 'entity_nif', label: 'NIF da entidade', kind: 'text' },
  { key: 'act_type', label: 'Tipo de ato', kind: 'text' },
  { key: 'procedure_type', label: 'Tipo de procedimento', kind: 'text' },
  { key: 'description', label: 'Descrição', kind: 'textarea', full: true },

  // --- Publicação e prazos ---
  { key: 'publication_date', label: 'Data de publicação', kind: 'date', section: 'Publicação e prazos' },
  { key: 'proposal_deadline', label: 'Prazo para propostas', kind: 'date' },
  { key: 'proposal_period_days', label: 'Período de propostas (dias)', kind: 'number' },
  { key: 'dr_number', label: 'N.º do Diário da República', kind: 'text' },
  { key: 'series', label: 'Série', kind: 'text' },
  { key: 'year', label: 'Ano', kind: 'number' },

  // --- Objeto do contrato ---
  { key: 'base_price', label: 'Preço base (€)', kind: 'number', section: 'Objeto do contrato' },
  { key: 'contract_types', label: 'Tipos de contrato', kind: 'list', full: true },
  { key: 'cpvs', label: 'CPVs', kind: 'list', full: true },
  { key: 'lots', label: 'Lotes', kind: 'list', full: true },

  // --- Ligações ---
  { key: 'url', label: 'URL do anúncio', kind: 'text', full: true, section: 'Ligações' },
  { key: 'procedure_documents_url', label: 'URL das peças do procedimento', kind: 'text', full: true },
  { key: 'specifications_path', label: 'Caminho do caderno de encargos', kind: 'text', full: true },

  // --- Estado ---
  {
    key: 'environmental_criteria',
    label: 'Critérios ambientais',
    kind: 'bool',
    section: 'Estado',
  },
  { key: 'status', label: 'Estado', kind: 'status' },
]

const STATUS_OPTIONS = Object.entries(NOTICE_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/** Split a textarea's lines into trimmed, non-empty items. */
function linesOf(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
}

function toInitial(notice: Notice): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of FIELDS) {
    const raw = notice[f.key]
    if (raw == null) {
      out[f.key as string] = f.kind === 'bool' ? 'false' : f.kind === 'status' ? 'active' : ''
    } else if (f.kind === 'date') {
      out[f.key as string] = String(raw).slice(0, 10)
    } else if (f.kind === 'bool') {
      out[f.key as string] = raw ? 'true' : 'false'
    } else if (f.kind === 'list') {
      out[f.key as string] = Array.isArray(raw) ? raw.map(String).join('\n') : String(raw)
    } else {
      out[f.key as string] = String(raw)
    }
  }
  return out
}

export function AnuncioEdit() {
  const { id } = useParams<{ id: string }>()
  const noticeId = Number(id)

  const { data: notice, loading, error, reload } = useApiQuery(
    (signal) => getNotice(noticeId, signal),
    [noticeId],
  )

  return (
    <div>
      <Link to={`/anuncios/${noticeId}`} className={detail.back}>
        ← Voltar ao anúncio
      </Link>
      <PageHeader
        eyebrow="Edição"
        title="Editar anúncio"
        description="Só os campos alterados são enviados para a API."
      />
      {loading ? (
        <LoadingBlock message="A carregar anúncio…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : notice ? (
        <EditForm notice={notice} />
      ) : null}
    </div>
  )
}

function EditForm({ notice }: { notice: Notice }) {
  const initial = useMemo(() => toInitial(notice), [notice])
  const [values, setValues] = useState<Record<string, string>>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState<string | null>(null)
  const [result, setResult] = useState<{ updated: string[]; ignored: string[] } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const buildChanges = (): Record<string, unknown> => {
    const changes: Record<string, unknown> = {}
    for (const f of FIELDS) {
      const key = f.key as string
      if (values[key] === initial[key]) continue
      const val = values[key]

      if (f.kind === 'number') changes[key] = val === '' ? null : Number(val)
      else if (f.kind === 'date') changes[key] = val === '' ? null : val
      else if (f.kind === 'bool') changes[key] = val === 'true'
      else if (f.kind === 'list') changes[key] = linesOf(val)
      else changes[key] = val
    }
    return changes
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setGeneral(null)
    setResult(null)
    setErrors({})

    const changes = buildChanges()
    if (Object.keys(changes).length === 0) {
      setGeneral('Não há alterações para gravar.')
      return
    }

    setSubmitting(true)
    try {
      const res = await editNotice(notice.id, changes)
      setResult({ updated: res.updated ?? [], ignored: res.ignored ?? [] })
    } catch (err) {
      // A 400 carries `details` keyed by field — surface them inline.
      setErrors(fieldErrorsFrom(err))
      setGeneral(
        err instanceof ApiError ? err.message : 'Não foi possível gravar as alterações.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const rowStyle = (full?: boolean) => (full ? { gridColumn: '1 / -1' } : undefined)

  return (
    <Card>
      <Form onSubmit={onSubmit} noValidate>
        {general && <Alert variant="danger">{general}</Alert>}
        {result && (
          <Alert variant="success" title="Alterações gravadas">
            {result.updated.length > 0
              ? `Atualizado: ${result.updated.join(', ')}.`
              : 'Nenhum campo foi alterado.'}
            {result.ignored.length > 0 && ` Ignorado: ${result.ignored.join(', ')}.`}
          </Alert>
        )}

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
            if (f.kind === 'list') {
              control = <Textarea {...common} hint="Um item por linha" rows={4} />
            } else if (f.kind === 'textarea') {
              control = <Textarea {...common} rows={4} />
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
            } else if (f.kind === 'status') {
              control = <Select {...common} options={STATUS_OPTIONS} />
            } else {
              control = (
                <Input
                  {...common}
                  type={f.kind === 'number' ? 'number' : f.kind === 'date' ? 'date' : 'text'}
                  step={f.key === 'base_price' ? '0.01' : undefined}
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
        </FormGrid>

        <FormActions>
          <ButtonLink to={`/anuncios/${notice.id}`} variant="ghost">
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
