import { Card } from '../../../shared/components'
import { cx } from '../../../shared/utils/cx'
import { formatCurrency, formatPercent } from '../../../shared/utils/format'
import type { MatchItem } from '../types'
import styles from './MatchCard.module.css'

interface MatchCardProps {
  match: MatchItem
  selected?: boolean
  onSelect?: () => void
}

export function MatchCard({ match, selected = false, onSelect }: MatchCardProps) {
  const pct =
    match.max_score > 0
      ? Math.round((match.score / match.max_score) * 100)
      : 0
  // Each of the three can be null (aviso without embeddings).
  const asPct = (v: number | null) => (v != null ? Math.round(v * 100) : null)
  const relevance = asPct(match.activity_relevance)
  const sector = asPct(match.sector_similarity)
  const general = asPct(match.general_similarity)
  const relevanceParts = [
    sector != null && `Setor ${sector}%`,
    general != null && `Geral ${general}%`,
  ].filter(Boolean) as string[]

  // The `eligibility` flag and the `breakdown` points can disagree (a
  // criterion may be reported eligible but still contribute 0 points). Treat
  // 0 points as authoritative so we never show a green check next to a
  // criterion that didn't actually score.
  const pointsByCriterion = new Map(match.breakdown.map((b) => [b.criterion, b.points]))

  return (
    <Card
      interactive={Boolean(onSelect)}
      className={cx(styles.card, selected && styles.selected)}
      onClick={onSelect}
    >
      <div className={styles.head}>
        <div className={styles.titleGroup}>
          <span className={styles.code}>{match.grant_code}</span>
          {/* Not a link: clicking anywhere on the card (title included) opens
              the side panel; the full aviso opens from there. */}
          <span className={styles.title}>{match.title}</span>
        </div>
        <div className={styles.scoreNum}>
          {match.score}
          <span>/ {match.max_score}</span>
        </div>
      </div>

      <div
        className={styles.bar}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Pontuação de correspondência"
      >
        <span className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>

      <div className={styles.stats}>
        {relevance != null && (
          <div
            className={styles.stat}
            title="Relevância = 60% afinidade setorial + 40% afinidade geral"
          >
            <span className={styles.statK}>Relevância</span>
            <span className={styles.statV}>{relevance}%</span>
            {relevanceParts.length > 0 && (
              <span className={styles.statSub}>{relevanceParts.join(' · ')}</span>
            )}
          </div>
        )}
        <div className={styles.stat}>
          <span className={styles.statK}>Taxa efetiva</span>
          <span className={styles.statV}>
            {formatPercent(match.effective_financing_rate)}
          </span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statK}>Dotação efetiva</span>
          <span className={styles.statV}>
            {formatCurrency(match.effective_budget_allocation)}
          </span>
        </div>
      </div>

      {match.eligibility.length > 0 && (
        <div className={styles.elig}>
          <div className={styles.eligTitle}>Elegibilidade</div>
          <ul className={styles.eligList}>
            {match.eligibility.map((e, i) => {
              const points = pointsByCriterion.get(e.criterion)
              const isEligible = points === 0 ? false : e.eligible
              return (
                <li key={i} className={isEligible ? styles.ok : styles.no}>
                  <span className={styles.mark} aria-hidden="true">
                    {isEligible ? '✓' : '✕'}
                  </span>
                  {e.label}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}
