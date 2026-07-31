import { FaCalendarAlt } from 'react-icons/fa'
import type { Grant } from '../../avisos/types'
import type { MatchItem } from '../types'
import { useAuth } from '../../auth/AuthContext'
import {
  ButtonLink,
  Chips,
  Deadline,
  DescriptionList,
  ErrorState,
  ExternalLinkButton,
  LoadingBlock,
  Tag,
} from '../../../shared/components'
import type { DescriptionItem } from '../../../shared/components'
import type { ApiError } from '../../../api/client'
import { formatCurrency, formatDate, formatPercent } from '../../../shared/utils/format'
import { hasValue, toList, toStringArray } from '../../../shared/utils/collections'
import { cx } from '../../../shared/utils/cx'
import { MEETING_BOOKING_URL } from '../../../shared/constants/links'
import styles from './MatchDetailPanel.module.css'

interface MatchDetailPanelProps {
  match: MatchItem
  grant: Grant | null
  loading: boolean
  error: ApiError | null
}

type Tone = 'ok' | 'mid' | 'low'

function toneForPct(pct: number): Tone {
  if (pct >= 75) return 'ok'
  if (pct >= 50) return 'mid'
  return 'low'
}

/** Highest max_global_rate across financing_rates rows, or the top-level rate.
 *  The API sometimes serialises this field as a numeric string (e.g. "85.0"). */
function bestRate(grant: Grant): number | null {
  const values = (grant.financing_rates ?? [])
    .map((r) => Number(r.max_global_rate))
    .filter((v) => Number.isFinite(v))
  if (values.length > 0) return Math.max(...values)
  return grant.financing_rate ?? null
}

/** Key facts of the matched aviso (title + score badge live in the header). */
export function MatchDetailPanel({ match, grant, loading, error }: MatchDetailPanelProps) {
  const { isAuthenticated } = useAuth()

  return (
    <div className={styles.wrap}>
      {loading && <LoadingBlock message="A carregar aviso…" />}
      {error && <ErrorState error={error} />}

      {grant && !loading && (
        <>
          <Deadline
            label="Encerramento"
            date={grant.closing_date}
            start={grant.opening_date ?? grant.publication_date}
          />

          <DescriptionList
            items={
              [
                hasValue(grant.total_allocation) && {
                  label: 'Dotação total',
                  value: formatCurrency(grant.total_allocation),
                },
                bestRate(grant) != null && {
                  label: 'Taxa de financiamento',
                  value: formatPercent(bestRate(grant)),
                },
                hasValue(grant.next_phase_date) && {
                  label: 'Próxima fase',
                  value: formatDate(grant.next_phase_date),
                  mono: true,
                },
                hasValue(grant.minimum_investment) && {
                  label: 'Investimento mínimo',
                  value: formatCurrency(grant.minimum_investment),
                },
                hasValue(grant.maximum_investment) && {
                  label: 'Investimento máximo',
                  value: formatCurrency(grant.maximum_investment),
                },
                hasValue(grant.operation_typology) && {
                  label: 'Tipologia',
                  value: grant.operation_typology,
                },
              ].filter(Boolean) as DescriptionItem[]
            }
          />

          {hasValue(grant.objective) && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Objetivo</h3>
              <p className={styles.text}>{grant.objective}</p>
            </section>
          )}

          {toStringArray(grant.eligible_regions).length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Regiões elegíveis</h3>
              <Chips>
                {toStringArray(grant.eligible_regions).map((r) => (
                  <Tag key={r}>{r}</Tag>
                ))}
              </Chips>
            </section>
          )}

          {toList(grant.covered_actions).length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Ações abrangidas</h3>
              {toList(grant.covered_actions).map((a, i) => (
                <p key={i} className={styles.text}>
                  {a}
                </p>
              ))}
            </section>
          )}

          {toStringArray(grant.final_recipients).length > 0 && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Entidades elegíveis</h3>
              <Chips>
                {toStringArray(grant.final_recipients).map((r) => (
                  <Tag key={r}>{r}</Tag>
                ))}
              </Chips>
            </section>
          )}

          <div className={styles.footer}>
            {!isAuthenticated && (
              <ExternalLinkButton
                href={MEETING_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                variant="accent"
                fullWidth
                leftIcon={<FaCalendarAlt />}
              >
                Marcar reunião
              </ExternalLinkButton>
            )}
            <ButtonLink
              to={`/avisos/${match.opportunity_id}`}
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
            >
              Ver aviso completo →
            </ButtonLink>
          </div>
        </>
      )}
    </div>
  )
}

/** Composite title (grant name + MATCH % badge) for the SidePanel header. */
export function MatchPanelTitle({ match }: { match: MatchItem }) {
  const pct = match.max_score > 0 ? Math.round((match.score / match.max_score) * 100) : 0
  return (
    <span className={styles.titleRow}>
      <span className={styles.titleText}>{match.title}</span>
      <span className={cx(styles.badge, styles[toneForPct(pct)])}>
        {pct}%<small>match</small>
      </span>
    </span>
  )
}
