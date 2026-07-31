import { useState, type FormEvent } from 'react'
import { evaluateNif, promoteViewer } from '../api'
import type { EvaluateNifPayload, MatchItem, MatchResponse } from '../types'
import { CompanyPanel } from '../components/CompanyPanel'
import { MatchCard } from '../components/MatchCard'
import { MatchDetailPanel, MatchPanelTitle } from '../components/MatchDetailPanel'
import { getGrant } from '../../avisos/api'
import { useAuth } from '../../auth/AuthContext'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Form,
  FormActions,
  FormGrid,
  Input,
  LoadingBlock,
  Modal,
  PageHeader,
  Section,
  Select,
  SidePanel,
  Spinner,
} from '../../../shared/components'
import {
  ENTITY_SIZE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
} from '../../../shared/constants/domain'
import { ApiError, type MissingField } from '../../../api/client'
import styles from './MatchEvaluate.module.css'

const EMPTY = { nif: '', cae: '', region: '', dimension: '', entity_type: '' }
const EMPTY_CONTACT = { email: '', name: '', job_title: '' }

/** Second-step fields: only requested once cae/region/dimension/entity_type
 *  are already resolved, so a popup (not the inline form) collects them. */
const CONTACT_FIELDS = new Set(['email', 'name', 'job_title'])

export function MatchEvaluate() {
  const { hasRole } = useAuth()
  const canPromote = hasRole('admin', 'commercial_grants', 'commercial_public')
  const canSeeCompany = hasRole('admin', 'commercial_grants', 'commercial_public')
  /** The LLM's concrete eligibility reasoning isn't shown to anonymous
   *  visitors or viewers — only admin/commercial. */
  const canSeeLlmReason = hasRole('admin', 'commercial_grants', 'commercial_public')

  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<MatchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<MissingField[]>([])
  const [promoteMsg, setPromoteMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  )

  // Second step (anonymous only): once cae/region/dimension/entity_type are
  // resolved, the API can still 422 asking for contact info. `lastPayload`
  // remembers what was already sent so the popup only adds email/name/job_title.
  const [lastPayload, setLastPayload] = useState<EvaluateNifPayload | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [contact, setContact] = useState(EMPTY_CONTACT)
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState<string | null>(null)
  const [contactMissing, setContactMissing] = useState<MissingField[]>([])
  const [contactError, setContactError] = useState<string | null>(null)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  // `selected` keeps the clicked match (its score/breakdown render instantly);
  // `panelOpen` drives the slide-in/out so content persists during close.
  const [selected, setSelected] = useState<MatchItem | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const {
    data: selectedGrant,
    loading: grantLoading,
    error: grantError,
  } = useApiQuery(
    (signal) =>
      selected != null ? getGrant(selected.opportunity_id, signal) : Promise.resolve(null),
    [selected?.opportunity_id],
  )

  const set = (key: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const missingKeys = new Set(missing.map((m) => m.field))
  const setContactField = (key: keyof typeof EMPTY_CONTACT) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setContact((c) => ({ ...c, [key]: e.target.value }))
  const contactMissingKeys = new Set(contactMissing.map((m) => m.field))

  const run = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setPromoteMsg(null)
    setSelected(null)
    setPanelOpen(false)
    setContactOpen(false)
    setContactMissing([])
    setContactError(null)
    setLoading(true)

    const payload: EvaluateNifPayload = { nif: form.nif.trim() }
    if (form.cae) payload.cae = form.cae
    if (form.region) payload.region = form.region
    if (form.dimension) payload.dimension = form.dimension
    if (form.entity_type) payload.entity_type = form.entity_type
    setLastPayload(payload)

    try {
      const res = await evaluateNif(payload)
      setResult(res)
      setMissing([])
    } catch (err) {
      if (err instanceof ApiError && err.needsMoreInfo) {
        if (err.missingFields.some((f) => CONTACT_FIELDS.has(f.field))) {
          // Business fields already resolved — this second step is
          // contact info, collected via the popup, not the inline form.
          setMissing([])
          setContact(EMPTY_CONTACT)
          setConsent(false)
          setConsentError(null)
          setContactMissing(err.missingFields)
          setContactOpen(true)
        } else {
          setMissing(err.missingFields)
          setError(err.message)
        }
        setResult(null)
      } else {
        setError(
          err instanceof ApiError ? err.message : 'Não foi possível avaliar o NIF.',
        )
        setResult(null)
        setMissing([])
      }
    } finally {
      setLoading(false)
    }
  }

  const submitContact = async (e: FormEvent) => {
    e.preventDefault()
    if (!lastPayload) return
    if (!consent) {
      setConsentError('É necessário aceitar para continuar.')
      return
    }
    setContactError(null)
    setContactSubmitting(true)

    const payload: EvaluateNifPayload = {
      ...lastPayload,
      email: contact.email.trim(),
      name: contact.name.trim(),
      job_title: contact.job_title.trim(),
    }

    try {
      const res = await evaluateNif(payload)
      setResult(res)
      setLastPayload(payload)
      setContactMissing([])
      setContactOpen(false)
    } catch (err) {
      if (err instanceof ApiError && err.needsMoreInfo) {
        setContactMissing(err.missingFields)
        setContactError(err.message)
      } else {
        setContactError(
          err instanceof ApiError ? err.message : 'Não foi possível avaliar o NIF.',
        )
      }
    } finally {
      setContactSubmitting(false)
    }
  }

  const onPromote = async () => {
    if (!result) return
    try {
      const r = await promoteViewer(result.nif)
      setPromoteMsg({
        ok: true,
        text: `Entidade promovida (utilizador #${r.user_id}, papel ${r.role}).`,
      })
    } catch (err) {
      setPromoteMsg({
        ok: false,
        text: err instanceof ApiError ? err.message : 'Falha ao promover.',
      })
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Correspondência"
        title="Avaliar NIF"
        description="Introduza o NIF de uma entidade para cruzar com os avisos e obter os elegíveis, ordenados por relevância."
      />

      <div className={styles.layout}>
        {/* Left column — search */}
        <div className={styles.left}>
          <Card>
            <Form onSubmit={run} noValidate>
              {error && (
                <Alert variant={missing.length > 0 ? 'warning' : 'danger'}>{error}</Alert>
              )}
              {missing.length > 0 && (
                <Alert variant="info" title="É necessária mais informação">
                  Complete: {missing.map((m) => m.label).join(', ')}.
                </Alert>
              )}

              <Input
                label="NIF"
                inputMode="numeric"
                placeholder="500000000"
                value={form.nif}
                onChange={set('nif')}
                required
                autoFocus
              />

              <div className={styles.optional}>Dados adicionais (opcionais)</div>
              <FormGrid>
                <Input
                  label="CAE"
                  value={form.cae}
                  onChange={set('cae')}
                  error={missingKeys.has('cae') ? 'Campo necessário' : undefined}
                />
                <Input
                  label="Região"
                  value={form.region}
                  onChange={set('region')}
                  error={missingKeys.has('region') ? 'Campo necessário' : undefined}
                />
                <Select
                  label="Dimensão"
                  placeholder="Selecionar…"
                  options={ENTITY_SIZE_OPTIONS}
                  value={form.dimension}
                  onChange={set('dimension')}
                  error={missingKeys.has('dimension') ? 'Campo necessário' : undefined}
                />
                <Select
                  label="Tipo de entidade"
                  placeholder="Selecionar…"
                  options={ENTITY_TYPE_OPTIONS}
                  value={form.entity_type}
                  onChange={set('entity_type')}
                  error={missingKeys.has('entity_type') ? 'Campo necessário' : undefined}
                />
              </FormGrid>

              <FormActions>
                <Button type="submit" fullWidth loading={loading}>
                  Avaliar elegibilidade
                </Button>
              </FormActions>
            </Form>

            {loading && (
              <div className={styles.slow}>
                <Spinner size={18} />
                Esta operação pode demorar alguns minutos. Não feche a página.
              </div>
            )}
          </Card>

          {result && (
            <>
              {promoteMsg && (
                <Alert variant={promoteMsg.ok ? 'success' : 'danger'}>
                  {promoteMsg.text}
                </Alert>
              )}
              {canSeeCompany && (
                <CompanyPanel company={result.company} nif={result.nif} />
              )}
              {canPromote && (
                <Button variant="secondary" fullWidth onClick={onPromote}>
                  Promover a cliente
                </Button>
              )}
            </>
          )}
        </div>

        {/* Right column — eligible grants */}
        <div className={styles.right}>
          {result ? (
            <Section
              eyebrow={`${result.matches.length} correspondência(s)`}
              title="Avisos elegíveis"
            >
              {result.matches.length > 0 ? (
                <div className={styles.matchList}>
                  {result.matches.map((m) => (
                    <MatchCard
                      key={m.opportunity_id}
                      match={m}
                      selected={panelOpen && selected?.opportunity_id === m.opportunity_id}
                      showLlmReason={canSeeLlmReason}
                      onSelect={() => {
                        setSelected(m)
                        setPanelOpen(true)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Sem correspondências"
                  message="Nenhum aviso elegível para esta entidade."
                />
              )}
            </Section>
          ) : loading ? (
            <Card>
              <LoadingBlock message="A avaliar elegibilidade…" />
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="⇋"
                title="Avisos elegíveis"
                message="Introduza um NIF à esquerda para ver os avisos elegíveis, ordenados por relevância."
              />
            </Card>
          )}
        </div>
      </div>

      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={selected && <MatchPanelTitle match={selected} />}
        ariaLabel={selected ? `Detalhe do match: ${selected.title}` : undefined}
      >
        {selected && (
          <MatchDetailPanel
            match={selected}
            grant={selectedGrant}
            loading={grantLoading}
            error={grantError}
          />
        )}
      </SidePanel>

      <Modal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        ariaLabel="Estamos à procura dos incentivos que melhor se adequam a si"
        footer={
          <Button
            type="submit"
            form="contact-form"
            fullWidth
            loading={contactSubmitting}
            disabled={!consent}
          >
            Ver correspondências →
          </Button>
        }
      >
        <div className={styles.contactHero}>
          <span className={styles.contactHeroEyebrow}>Quase lá</span>
          <p className={styles.contactHeroText}>
            Estamos à procura dos incentivos que melhor se adequam a si.
          </p>
        </div>
        <p className={styles.contactSubtext}>Preencha os dados para o podermos ajudar</p>
        <Form id="contact-form" onSubmit={submitContact} noValidate>
          {contactError && <Alert variant="warning">{contactError}</Alert>}
          <Input
            label="Email"
            type="email"
            value={contact.email}
            onChange={setContactField('email')}
            error={contactMissingKeys.has('email') ? 'Campo necessário' : undefined}
            required
            autoFocus
          />
          <FormGrid>
            <Input
              label="Cargo"
              value={contact.job_title}
              onChange={setContactField('job_title')}
              error={contactMissingKeys.has('job_title') ? 'Campo necessário' : undefined}
              required
            />
            <Input
              label="Nome"
              value={contact.name}
              onChange={setContactField('name')}
              error={contactMissingKeys.has('name') ? 'Campo necessário' : undefined}
              required
            />
          </FormGrid>
          <Checkbox
            label="Concordo em receber comunicações acerca de oportunidades de incentivos"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked)
              if (e.target.checked) setConsentError(null)
            }}
            error={consentError ?? undefined}
            required
          />
        </Form>
      </Modal>
    </div>
  )
}
