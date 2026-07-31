import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { FaCalendarAlt } from 'react-icons/fa'
import { getGrant } from '../api'
import type { FinancingRateRow } from '../types'
import {
  ApplicationDocuments,
  AreaChips,
  BeneficiariesByAction,
  CodeChips,
  ContactCard,
  CriteriaList,
  DocumentsList,
  EvaluationView,
  ExpenseColumns,
  ExpenseLimits,
  IndicatorGroups,
  LegislationList,
  PenaltyView,
  PhaseAreasTable,
  PhasesTimeline,
  TextList,
} from '../components/GrantCollections'
import { useAuth } from '../../auth/AuthContext'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { apiUrl } from '../../../api/client'
import {
  ActiveBadge,
  Alert,
  Badge,
  ButtonLink,
  Card,
  Collapsible,
  ExternalLinkButton,
  type Column,
  DataTable,
  Deadline,
  DescriptionList,
  DetailHero,
  ErrorState,
  LoadingBlock,
  MetricsStrip,
  Section,
  SectionNav,
  type SectionNavItem,
} from '../../../shared/components'
import {
  formatCurrency,
  formatDate,
  formatPercent,
  orDash,
} from '../../../shared/utils/format'
import { hasValue, toList, toStringArray } from '../../../shared/utils/collections'
import { MEETING_BOOKING_URL } from '../../../shared/constants/links'
import detail from '../../../shared/styles/detail.module.css'

const rateColumns: Column<FinancingRateRow>[] = [
  {
    key: 'company_size',
    header: 'Dimensão',
    primary: true,
    render: (r) => orDash(r.company_size),
  },
  {
    key: 'base_rate',
    header: 'Taxa base',
    align: 'right',
    render: (r) => formatPercent(r.base_rate),
  },
  {
    key: 'max_global_rate',
    header: 'Taxa máx.',
    align: 'right',
    render: (r) => formatPercent(r.max_global_rate),
  },
]

const H3 = { margin: 'var(--space-5) 0 var(--space-2)' }

interface EditFlash {
  updated: string[]
  ignored: string[]
  collectionsUpdated?: string[]
  financingRate?: number | null
}

export function AvisoDetail() {
  const { id } = useParams<{ id: string }>()
  const grantId = Number(id)
  const { hasRole, isAuthenticated } = useAuth()
  const canEdit = hasRole('admin', 'commercial_grants', 'commercial_public')
  const location = useLocation()

  // Success message handed over by the edit page after a save.
  const [flash, setFlash] = useState<EditFlash | null>(
    (location.state as { flash?: EditFlash } | null)?.flash ?? null,
  )
  // Drop the router state so the message doesn't reappear on refresh/back.
  useEffect(() => {
    if (location.state) window.history.replaceState({}, '')
  }, [location.state])

  const { data: grant, loading, error, reload } = useApiQuery(
    (signal) => getGrant(grantId, signal),
    [grantId],
  )

  if (loading) return <LoadingBlock message="A carregar aviso…" />
  if (error) {
    return (
      <div>
        <Link to="/avisos" className={detail.back}>
          ← Voltar aos avisos
        </Link>
        <ErrorState error={error} onRetry={reload} />
      </div>
    )
  }
  if (!grant) return null

  const includedCaes = toStringArray(grant.included_caes)
  const excludedCaes = toStringArray(grant.excluded_caes)
  const eligibleRegions = toStringArray(grant.eligible_regions)
  const beneficiaryCriteria = toStringArray(grant.beneficiary_eligibility_criteria)
  const finalRecipients = toStringArray(grant.final_recipients)

  const coveredActions = toList(grant.covered_actions)
  const admissibility = toList(grant.admissibility_conditions)
  const commitment = toList(grant.commitment_requirements)
  const paymentMethods = toList(grant.payment_methods)
  const obligations = toList(grant.beneficiary_obligations)
  const contacts = toList(grant.contact)
  const beneficiariesByAction = grant.beneficiaries_by_action ?? []
  const coveredAreas = grant.covered_areas ?? []
  const appDocs = grant.application_documents ?? []
  const outputInd = grant.output_indicators ?? []
  const resultInd = grant.result_indicators ?? []
  const monitoringInd = grant.monitoring_indicators ?? []

  const hasObjective =
    hasValue(grant.objective) ||
    hasValue(grant.specific_objective) ||
    coveredActions.length > 0
  const hasFinanceTables = Boolean(
    grant.financing_rates?.length || grant.phase_areas?.length,
  )
  const hasPhases = Boolean(grant.phases?.length)
  const hasEval = Boolean(
    grant.evaluation_methodologies?.some(
      (m) => m.evaluation_criteria?.length || m.project_merit_formula,
    ),
  )
  const hasIndicators =
    outputInd.length > 0 || resultInd.length > 0 || monitoringInd.length > 0
  const hasExpenses = Boolean(
    grant.eligible_expenses?.length ||
      grant.ineligible_expenses?.length ||
      grant.expense_limits?.length,
  )
  const hasGestao = paymentMethods.length > 0 || obligations.length > 0
  const hasPenalties = Boolean(
    grant.non_compliance_penalties?.some(
      (p) =>
        p.rule_description ||
        p.indicator_types ||
        p.max_penalty_percentage != null ||
        p.compliance_grade_formula,
    ),
  )
  const hasCandidatura = appDocs.length > 0
  const hasLegislation = Boolean(grant.applicable_legislation?.length)

  const navItems: SectionNavItem[] = [
    hasObjective && { id: 'objetivo', label: 'Objetivo' },
    { id: 'elegibilidade', label: 'Elegibilidade' },
    hasFinanceTables && { id: 'financeiro', label: 'Financeiro' },
    hasPhases && { id: 'fases', label: 'Fases' },
    hasEval && { id: 'avaliacao', label: 'Avaliação' },
    hasIndicators && { id: 'indicadores', label: 'Indicadores' },
    hasExpenses && { id: 'despesas', label: 'Despesas' },
    hasGestao && { id: 'gestao', label: 'Gestão' },
    hasPenalties && { id: 'penalizacoes', label: 'Penalizações' },
    hasCandidatura && { id: 'candidatura', label: 'Candidatura' },
    hasLegislation && { id: 'legislacao', label: 'Legislação' },
  ].filter(Boolean) as SectionNavItem[]

  const investment =
    hasValue(grant.minimum_investment) || hasValue(grant.maximum_investment)
      ? `${formatCurrency(grant.minimum_investment)} – ${formatCurrency(grant.maximum_investment)}`
      : '—'

  return (
    <div>
      <Link to="/avisos" className={detail.back}>
        ← Voltar aos avisos
      </Link>

      {flash && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="success" title="Aviso atualizado" onClose={() => setFlash(null)}>
            {flash.updated.length > 0
              ? `Atualizado: ${flash.updated.join(', ')}.`
              : 'Nenhum campo foi alterado.'}
            {flash.collectionsUpdated && flash.collectionsUpdated.length > 0 &&
              ` Coleções: ${flash.collectionsUpdated.join(', ')}.`}
            {flash.financingRate != null &&
              ` Taxa de financiamento recalculada: ${formatPercent(flash.financingRate)}.`}
            {flash.ignored.length > 0 && ` Ignorado: ${flash.ignored.join(', ')}.`}
          </Alert>
        </div>
      )}

      <DetailHero
        eyebrow={grant.financing_program ?? 'Aviso de financiamento'}
        badges={
          <>
            <ActiveBadge active={grant.active} />
            {grant.grant_code && <Badge variant="primary">{grant.grant_code}</Badge>}
          </>
        }
        title={grant.title}
        meta={orDash(grant.managing_entity)}
        actions={
          grant.document_url || canEdit || !isAuthenticated ? (
            <>
              {grant.document_url && (
                <ExternalLinkButton
                  href={apiUrl(grant.document_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="accent"
                  size="sm"
                >
                  Abrir aviso (PDF)
                </ExternalLinkButton>
              )}
              {!isAuthenticated && (
                <ExternalLinkButton
                  href={MEETING_BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="sm"
                  leftIcon={<FaCalendarAlt />}
                >
                  Marcar reunião
                </ExternalLinkButton>
              )}
              {canEdit && (
                <ButtonLink to={`/avisos/${grant.id}/edit`} variant="ghost" size="sm">
                  Editar aviso
                </ButtonLink>
              )}
            </>
          ) : undefined
        }
        aside={
          <Deadline
            label="Encerramento das candidaturas"
            date={grant.closing_date}
            start={grant.opening_date}
            sub={
              grant.opening_date
                ? `Abertura: ${formatDate(grant.opening_date)}`
                : undefined
            }
          />
        }
      />

      <MetricsStrip
        items={[
          {
            label: 'Dotação total',
            value: formatCurrency(grant.total_allocation),
            foot: 'Verba disponível',
          },
          {
            label: 'Taxa de financiamento',
            value: formatPercent(grant.financing_rate),
            foot: 'Máxima aplicável',
          },
          { label: 'Investimento elegível', value: investment },
          {
            label: 'Autofinanciamento máx.',
            value: formatPercent(grant.maximum_self_financing),
          },
        ]}
      />

      {navItems.length > 1 && <SectionNav items={navItems} />}

      <div className={detail.cols}>
        <div>
          {hasObjective && (
            <Section id="objetivo" eyebrow="Objeto do procedimento" title="Descrição">
              {hasValue(grant.objective) && (
                <p className={detail.lead}>{grant.objective}</p>
              )}
              {hasValue(grant.specific_objective) && (
                <p className={detail.lead}>{grant.specific_objective}</p>
              )}
              {coveredActions.length > 0 && (
                <>
                  <h3 style={H3}>Ações abrangidas</h3>
                  {coveredActions.map((a, i) => (
                    <p key={i} className={detail.lead}>
                      {a}
                    </p>
                  ))}
                </>
              )}
            </Section>
          )}

          <Section id="elegibilidade" eyebrow="Quem e o quê" title="Elegibilidade">
            <Card>
              <DescriptionList
                items={[
                  { label: 'Regime de auxílio', value: orDash(grant.state_aid_regime) },
                  {
                    label: 'Regiões elegíveis',
                    value: eligibleRegions.length ? eligibleRegions.join(', ') : '—',
                  },
                  {
                    label: 'Destinatários finais',
                    value: finalRecipients.length ? finalRecipients.join(', ') : '—',
                  },
                ]}
              />
            </Card>

            {beneficiaryCriteria.length > 0 && (
              <>
                <h3 style={H3}>Critérios de elegibilidade dos beneficiários</h3>
                <Card>
                  <CriteriaList items={beneficiaryCriteria} />
                </Card>
              </>
            )}

            {beneficiariesByAction.length > 0 && (
              <>
                <h3 style={H3}>Beneficiários por ação</h3>
                <BeneficiariesByAction items={beneficiariesByAction} />
              </>
            )}

            {admissibility.length > 0 && (
              <div style={H3}>
                <Collapsible title="Condições de admissibilidade" count={admissibility.length}>
                  <CriteriaList items={admissibility} />
                </Collapsible>
              </div>
            )}

            {commitment.length > 0 && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Collapsible title="Condições e compromissos específicos">
                  <TextList items={commitment} />
                </Collapsible>
              </div>
            )}

            {includedCaes.length > 0 && (
              <>
                <h3 style={H3}>CAE incluídos</h3>
                <CodeChips codes={includedCaes} />
              </>
            )}
            {excludedCaes.length > 0 && (
              <>
                <h3 style={H3}>CAE excluídos</h3>
                <CodeChips codes={excludedCaes} muted />
              </>
            )}
            {coveredAreas.length > 0 && (
              <>
                <h3 style={H3}>Áreas abrangidas</h3>
                <AreaChips areas={coveredAreas} />
              </>
            )}
          </Section>

          {hasFinanceTables && (
            <Section id="financeiro" eyebrow="Condições financeiras" title="Financeiro">
              {grant.financing_rates && grant.financing_rates.length > 0 && (
                <>
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-2)' }}>
                    Taxas por dimensão
                  </h3>
                  <DataTable
                    columns={rateColumns}
                    rows={grant.financing_rates}
                    rowKey={(_, i) => i}
                    ariaLabel="Taxas de financiamento"
                  />
                </>
              )}
              {grant.phase_areas && grant.phase_areas.length > 0 && (
                <>
                  <h3 style={H3}>Dotações por área</h3>
                  <PhaseAreasTable areas={grant.phase_areas} coveredAreas={coveredAreas} />
                </>
              )}
            </Section>
          )}

          {hasPhases && (
            <Section id="fases" eyebrow="Calendário" title="Fases">
              <PhasesTimeline phases={grant.phases!} />
            </Section>
          )}

          {hasEval && (
            <Section id="avaliacao" eyebrow="Mérito do projeto" title="Critérios de avaliação">
              <EvaluationView items={grant.evaluation_methodologies!} />
            </Section>
          )}

          {hasIndicators && (
            <Section id="indicadores" eyebrow="Metas e acompanhamento" title="Indicadores">
              <IndicatorGroups
                output={outputInd}
                result={resultInd}
                monitoring={monitoringInd}
              />
            </Section>
          )}

          {hasExpenses && (
            <Section id="despesas" eyebrow="Elegibilidade de despesa" title="Despesas">
              <ExpenseColumns
                eligible={grant.eligible_expenses}
                ineligible={grant.ineligible_expenses}
              />
              {grant.expense_limits && grant.expense_limits.length > 0 && (
                <>
                  <h3 style={H3}>Limites de despesa</h3>
                  <ExpenseLimits items={grant.expense_limits} />
                </>
              )}
            </Section>
          )}

          {hasGestao && (
            <Section id="gestao" eyebrow="Calendário e decisão" title="Gestão">
              {paymentMethods.length > 0 && (
                <>
                  <h3 style={{ marginTop: 0, marginBottom: 'var(--space-2)' }}>
                    Métodos de pagamento
                  </h3>
                  <TextList items={paymentMethods} />
                </>
              )}
              {obligations.length > 0 && (
                <>
                  <h3 style={H3}>Obrigações do beneficiário</h3>
                  <TextList items={obligations} />
                </>
              )}
            </Section>
          )}

          {hasPenalties && (
            <Section
              id="penalizacoes"
              eyebrow="Incumprimento"
              title="Penalizações por incumprimento"
            >
              <PenaltyView items={grant.non_compliance_penalties!} />
            </Section>
          )}

          {hasCandidatura && (
            <Section id="candidatura" eyebrow="Anexos" title="Documentos de candidatura">
              <Collapsible title="Ver documentos exigidos" count={appDocs.length}>
                <ApplicationDocuments items={appDocs} />
              </Collapsible>
            </Section>
          )}

          {hasLegislation && (
            <Section id="legislacao" eyebrow="Peças e legislação" title="Legislação aplicável">
              <Collapsible
                title="Ver legislação aplicável"
                count={grant.applicable_legislation!.length}
              >
                <LegislationList items={grant.applicable_legislation!} />
              </Collapsible>
            </Section>
          )}
        </div>

        <aside className={detail.aside}>
          <Card>
            <h3 style={{ marginBottom: 'var(--space-3)' }}>Ficha do aviso</h3>
            <DescriptionList
              items={[
                { label: 'Código', value: orDash(grant.grant_code), mono: true },
                { label: 'Programa', value: orDash(grant.financing_program) },
                { label: 'Entidade gestora', value: orDash(grant.managing_entity) },
                { label: 'Publicação', value: formatDate(grant.publication_date), mono: true },
                { label: 'Abertura', value: formatDate(grant.opening_date), mono: true },
                { label: 'Encerramento', value: formatDate(grant.closing_date), mono: true },
              ]}
            />
          </Card>
          {grant.documents && grant.documents.length > 0 && (
            <Card>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Documentos</h3>
              <DocumentsList documents={grant.documents} />
            </Card>
          )}
          {contacts.length > 0 && (
            <Card>
              <h3 style={{ marginBottom: 'var(--space-3)' }}>Contactos</h3>
              <ContactCard items={contacts} />
            </Card>
          )}
          {canEdit && (
            <ButtonLink to={`/avisos/${grant.id}/edit`} variant="primary" fullWidth>
              Editar aviso
            </ButtonLink>
          )}
        </aside>
      </div>
    </div>
  )
}
