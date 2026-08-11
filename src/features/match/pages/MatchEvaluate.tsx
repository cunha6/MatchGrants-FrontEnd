import { useEffect, useRef, useState, type FormEvent } from 'react'
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

/** Deliberately simple — just enough to catch typos before they cost a slow
 *  round trip, not full RFC 5322 validation. */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Cycles through while the search is still running — swapped for a single
 *  "almost done" message once it's taking a while (see `slow`). */
const ANALYZING_MESSAGES = [
  'A cruzar o seu perfil com os avisos disponíveis…',
  'A verificar os critérios de elegibilidade…',
  'A calcular as taxas de financiamento aplicáveis…',
  'A preparar os resultados…',
]

function AnalyzingAnimation({ slow }: { slow: boolean }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (slow) return
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % ANALYZING_MESSAGES.length),
      2500,
    )
    return () => clearInterval(timer)
  }, [slow])

  return (
    <div className={styles.analyzing}>
      <div className={styles.analyzingOrbit} aria-hidden="true">
        <span className={styles.analyzingRing} />
        <span className={styles.analyzingRing} />
        <span className={styles.analyzingCore}>⇋</span>
      </div>
      <p className={styles.analyzingText} key={slow ? 'slow' : index}>
        {slow ? 'Estamos quase a terminar.' : ANALYZING_MESSAGES[index]}
      </p>
    </div>
  )
}

/** After this long without a response, swap the "this can take minutes"
 *  notice for a more reassuring "almost done" one. Not from a real progress
 *  signal (evaluate-nif has none) — just a judgment call on when the generic
 *  warning starts feeling stale. */
const SLOW_SEARCH_MS = 20000

export function MatchEvaluate() {
  const { hasRole, isAuthenticated } = useAuth()
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
  const [emailError, setEmailError] = useState<string | null>(null)
  const [contactMissing, setContactMissing] = useState<MissingField[]>([])
  const [contactError, setContactError] = useState<string | null>(null)
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [slowSearch, setSlowSearch] = useState(false)
  const contactFieldsFilled = Boolean(
    contact.email.trim() && contact.name.trim() && contact.job_title.trim(),
  )
  // Bumped every time a *new* evaluate-nif call starts (the bare search, or
  // the popup's own complete one). A call whose generation no longer matches
  // when it resolves is stale — its result is ignored instead of clobbering
  // whatever a later call already decided. This is what lets the popup fire
  // its own request immediately on submit without coordinating with (or
  // waiting on) a bare search that might still be in flight.
  const generationRef = useRef(0)
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
  ) => {
    setContact((c) => ({ ...c, [key]: e.target.value }))
    if (key === 'email') setEmailError(null)
  }
  const contactMissingKeys = new Set(contactMissing.map((m) => m.field))

  /** The actual evaluate-nif call + outcome handling, shared by the initial
   *  submit and the popup's own (complete) submission. `generation` is
   *  captured at call time — if it's no longer current when the response
   *  arrives, this call has been superseded and its result is dropped. */
  const runSearch = async (payload: EvaluateNifPayload, generation: number) => {
    try {
      const res = await evaluateNif(payload)
      if (generationRef.current !== generation) return
      setResult(res)
      setMissing([])
      setContactOpen(false) // turned out not to be needed
    } catch (err) {
      if (generationRef.current !== generation) return
      if (err instanceof ApiError && err.needsMoreInfo) {
        setResult(null)
        if (err.missingFields.some((f) => CONTACT_FIELDS.has(f.field))) {
          // Business fields already resolved — this confirms contact is the
          // second step. The popup is already open; this just unlocks it.
          setMissing([])
          setContactMissing(err.missingFields)
        } else {
          setMissing(err.missingFields)
          setError(err.message)
          setContactOpen(false) // it's business fields, not contact, that's missing
        }
      } else {
        setError(err instanceof ApiError ? err.message : 'Não foi possível avaliar o NIF.')
        setResult(null)
        setMissing([])
        setContactOpen(false)
      }
    }
  }

  const run = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setPromoteMsg(null)
    setSelected(null)
    setPanelOpen(false)
    setContactMissing([])
    setContactError(null)
    setSlowSearch(false)
    setLoading(true)

    const payload: EvaluateNifPayload = { nif: form.nif.trim() }
    if (form.cae) payload.cae = form.cae
    if (form.region) payload.region = form.region
    if (form.dimension) payload.dimension = form.dimension
    if (form.entity_type) payload.entity_type = form.entity_type
    setLastPayload(payload)

    // Anonymous users get the contact popup right away, alongside the search
    // itself — not gated on the API asking for it first. Authenticated
    // admin/commercial never hit that 422, so they never see it.
    if (!isAuthenticated) {
      setContact(EMPTY_CONTACT)
      setConsent(false)
      setConsentError(null)
      setEmailError(null)
      setContactOpen(true)
    }

    const generation = ++generationRef.current
    const slowTimer = setTimeout(() => setSlowSearch(true), SLOW_SEARCH_MS)
    await runSearch(payload, generation)
    clearTimeout(slowTimer)
    setLoading(false)
  }

  const submitContact = async (e: FormEvent) => {
    e.preventDefault()
    if (contactSubmitting) return
    // Validate everything in the popup first — only once it's all good does
    // this move on to firing the request and showing the search animation.
    if (!isValidEmail(contact.email)) {
      setEmailError('Introduza um email válido.')
      return
    }
    if (!consent) {
      setConsentError('É necessário aceitar para continuar.')
      return
    }
    if (!lastPayload) return

    setContactError(null)
    setContactSubmitting(true)
    setSlowSearch(false)

    // This is now the authoritative, complete request — it supersedes any
    // bare search still in flight, so that one's eventual response (if any)
    // gets ignored instead of racing this one.
    const generation = ++generationRef.current
    const slowTimer = setTimeout(() => setSlowSearch(true), SLOW_SEARCH_MS)

    const payload: EvaluateNifPayload = {
      ...lastPayload,
      email: contact.email.trim(),
      name: contact.name.trim(),
      job_title: contact.job_title.trim(),
    }

    try {
      const res = await evaluateNif(payload)
      if (generationRef.current !== generation) return
      setResult(res)
      setLastPayload(payload)
      setContactMissing([])
      setContactOpen(false)
    } catch (err) {
      if (generationRef.current !== generation) return
      if (err instanceof ApiError && err.needsMoreInfo) {
        if (err.missingFields.some((f) => CONTACT_FIELDS.has(f.field))) {
          setContactMissing(err.missingFields)
          setContactError(err.message)
        } else {
          // Turns out business fields (not contact) are the actual gap —
          // hand it back to the main form instead of the contact popup.
          setMissing(err.missingFields)
          setError(err.message)
          setContactOpen(false)
        }
      } else {
        setContactError(
          err instanceof ApiError ? err.message : 'Não foi possível avaliar o NIF.',
        )
      }
    } finally {
      clearTimeout(slowTimer)
      if (generationRef.current === generation) setContactSubmitting(false)
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
                {slowSearch
                  ? 'Estamos quase a terminar.'
                  : 'Esta operação pode demorar alguns minutos. Não feche a página.'}
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
          contactSubmitting ? null : (
            <Button
              type="submit"
              form="contact-form"
              fullWidth
              disabled={!consent || !contactFieldsFilled}
            >
              Ver correspondências →
            </Button>
          )
        }
      >
        {contactSubmitting ? (
          <AnalyzingAnimation slow={slowSearch} />
        ) : (
          <>
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
                onBlur={() => {
                  if (contact.email.trim() && !isValidEmail(contact.email)) {
                    setEmailError('Introduza um email válido.')
                  }
                }}
                error={
                  emailError ??
                  (contactMissingKeys.has('email') ? 'Campo necessário' : undefined)
                }
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
          </>
        )}
      </Modal>
    </div>
  )
}
