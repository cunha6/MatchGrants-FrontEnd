import { useState, type ReactNode } from 'react'
import {
  Card,
  Chips,
  type Column,
  DataTable,
  DescriptionList,
  Tag,
} from '../../../shared/components'
import { apiUrl } from '../../../api/client'
import { cx } from '../../../shared/utils/cx'
import {
  formatCurrency,
  formatDate,
  formatPercent,
  orDash,
} from '../../../shared/utils/format'
import type {
  ApplicationDocument,
  BeneficiaryByAction,
  CoveredArea,
  EvaluationCriterion,
  EvaluationMethodology,
  ExpenseEntry,
  ExpenseLimit,
  GrantDocument,
  Indicator,
  LegislationEntry,
  NonCompliancePenalty,
  Phase,
  PhaseArea,
} from '../types'
import styles from './GrantCollections.module.css'

/* ---------- helpers ---------- */

/** Parse a pt-formatted number ("40.000.000,00") or plain number. */
function parsePtNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return value
  let s = String(value).replace(/[^\d.,-]/g, '')
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

/** First sentence of a long description ("Title. Details…" → "Title"). */
function firstSentence(text?: string): string {
  if (!text) return ''
  const idx = text.indexOf('. ')
  return (idx > 0 ? text.slice(0, idx) : text).trim()
}

/** Everything after the first sentence (the explanation). */
function restOfDescription(text?: string): string {
  if (!text) return ''
  const idx = text.indexOf('. ')
  return idx > 0 ? text.slice(idx + 2).trim() : ''
}

/* ---------- simple lists ---------- */

/** Numbered list for string-array fields (criteria, recipients…). */
export function CriteriaList({ items }: { items: string[] }) {
  return (
    <ol className={styles.criteria}>
      {items.map((it, i) => (
        <li key={i}>
          <span className={styles.critN}>{i + 1}</span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  )
}

/** CAE/region code chips (dashed style for excluded lists). */
export function CodeChips({
  codes,
  muted = false,
}: {
  codes: string[]
  muted?: boolean
}) {
  return (
    <Chips>
      {codes.map((c) => (
        <Tag key={c} code={c} muted={muted} />
      ))}
    </Chips>
  )
}

/* ---------- evaluation methodology (accordion) ---------- */

/** Read-only nested rows for the sub-criteria inside an open accordion item.
 *  Shows the sub-criterion's own formula (when it has one) and then its own
 *  children — so every formula in the tree is surfaced. */
function SubcriterionRow({
  c,
  depth,
}: {
  c: EvaluationCriterion
  depth: number
}) {
  const rest = restOfDescription(c.description)
  return (
    <div className={cx(styles.subRow, depth > 0 && styles.subNested)}>
      <div className={styles.subLine}>
        <span className={styles.subName}>
          {c.criterion_name && <b className={styles.sCode}>{c.criterion_name}</b>}
          {firstSentence(c.description)}
        </span>
        {c.weight != null && <span className={styles.sw}>{formatPercent(c.weight)}</span>}
      </div>
      {c.formula && <div className={styles.subFormula}>{c.formula}</div>}
      {rest && <p className={styles.subDesc}>{rest}</p>}
      {c.subcriteria?.map((s, i) => (
        <SubcriterionRow key={i} c={s} depth={depth + 1} />
      ))}
    </div>
  )
}

/** A single top-level criterion as a collapsible accordion item. */
function CriterionItem({ c, index }: { c: EvaluationCriterion; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cx(styles.citem, open && styles.citemOpen)}>
      <button
        type="button"
        className={styles.chead}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={cx(styles.dotc, styles[`seg${index % 4}`])} aria-hidden="true" />
        <span className={styles.ct}>
          {c.criterion_name && <b>{c.criterion_name} · </b>}
          {firstSentence(c.description)}
        </span>
        {c.is_exclusion_criterion && <span className={styles.excl}>Eliminatório</span>}
        {c.weight != null && <span className={styles.cw}>{formatPercent(c.weight)}</span>}
        <span className={styles.chev} aria-hidden="true">
          ›
        </span>
      </button>
      {open && (
        <div className={styles.csub}>
          {c.description && <p className={styles.cdesc}>{c.description}</p>}
          {c.formula && <div className={styles.cform}>{c.formula}</div>}
          {c.subcriteria?.map((s, i) => (
            <SubcriterionRow key={i} c={s} depth={0} />
          ))}
        </div>
      )}
    </div>
  )
}

interface WeightSegment {
  label: string
  /** Weight on a 0–100 scale (percentage points). */
  weight: number
}

/**
 * Parse the project-merit (MP) formula into its weighted terms.
 * Handles the many shapes the API returns, e.g.:
 *   "MP = 0,30*A + 0,35*B"     "MP = 0.5A + 0.5B"     "MP = 0.25×A + …"
 *   "MO=0,20 x A.1 + 0,15 x A.2 …"     "MP = 20%*A + 30%*B"
 *   "MP = 0.20×C1 + …"     "MP = 0.30×1 + …"     "… | Escala: 1-5"
 * Returns weights on a 0–100 scale (0,30 → 30; 20% → 20).
 */
function parseMeritFormula(formula?: string | null): WeightSegment[] {
  if (!formula) return []
  // Drop trailing annotations ("| Escala: …") and everything up to the "=".
  const rhs = formula.split('|')[0].split('=').slice(1).join('=') || formula
  const segments: WeightSegment[] = []
  for (const rawTerm of rhs.split('+')) {
    const term = rawTerm.trim()
    if (!term) continue
    const m = term.match(/^(\d+(?:[.,]\d+)?)\s*(%?)\s*[*×·x]?\s*(.+?)$/i)
    if (!m) continue
    const num = parseFloat(m[1].replace(',', '.'))
    if (!Number.isFinite(num)) continue
    // "%" is already 0–100; a bare coefficient (0.30) is a fraction → ×100.
    const weight = m[2] === '%' ? num : num * 100
    const label = m[3].trim()
    if (label) segments.push({ label, weight })
  }
  return segments
}

function WeightedBar({ segments }: { segments: WeightSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.weight, 0) || 100
  return (
    <div className={styles.wbar}>
      {segments.map((s, i) => (
        <div
          key={i}
          className={cx(styles.wseg, styles[`seg${i % 4}`])}
          style={{ width: `${(s.weight / total) * 100}%` }}
          title={s.label || undefined}
        >
          <span className={styles.wsegName}>{s.label}</span>
          <span className={styles.wsegPct}>{formatPercent(s.weight)}</span>
        </div>
      ))}
    </div>
  )
}

function parseScoringScale(
  scale?: EvaluationMethodology['scoring_scale'],
): { grade: string; title: string; desc: string }[] {
  if (typeof scale !== 'string') return []
  const body = scale.replace(/^\s*Escala[^:]*:\s*/i, '')
  const out: { grade: string; title: string; desc: string }[] = []
  const re = /(\d)\s*-\s*([^:]+?):\s*([^;]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    const desc = m[3].split(/\.\s+[A-ZÀ-Ú]/)[0].trim().replace(/[.;]+$/, '')
    const title = m[2].trim()
    if (title.length <= 40) out.push({ grade: m[1].trim(), title, desc })
  }
  return out
}

function EvaluationMethodologyCard({ m }: { m: EvaluationMethodology }) {
  const criteria = m.evaluation_criteria ?? []
  const scale = parseScoringScale(m.scoring_scale)
  // The bar reflects the MP formula's terms; only if there's no parseable
  // formula does it fall back to the (sometimes flattened) criteria weights.
  const mpSegments = parseMeritFormula(m.project_merit_formula)
  const barSegments: WeightSegment[] =
    mpSegments.length >= 2
      ? mpSegments
      : criteria
          .filter((c) => c.weight != null)
          .map((c) => ({ label: c.criterion_name ?? '', weight: c.weight ?? 0 }))
  return (
    <div className={styles.evalCard}>
      {barSegments.length > 0 && <WeightedBar segments={barSegments} />}
      {m.project_merit_formula && (
        <div className={styles.formula}>{m.project_merit_formula}</div>
      )}
      {m.min_global_score != null && (
        <p className={styles.evalNote}>
          Pontuação mínima global: <b>{m.min_global_score}</b>
        </p>
      )}

      {criteria.length > 0 && (
        <div className={styles.clist}>
          {criteria.map((c, i) => (
            <CriterionItem key={i} c={c} index={i} />
          ))}
        </div>
      )}

      {scale.length >= 3 && (
        <>
          <h4 className={styles.evalSub}>Escala de pontuação</h4>
          <div className={styles.scale}>
            {scale.map((s) => (
              <div key={s.grade} className={styles.sc}>
                <div className={styles.scGrade}>{s.grade}</div>
                <div className={styles.scTitle}>{s.title}</div>
                <div className={styles.scDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {m.tiebreaker_criteria && m.tiebreaker_criteria.length > 0 && (
        <p className={styles.tiebreak}>
          <b>Desempate:</b> {m.tiebreaker_criteria.join(' · ')}
        </p>
      )}
    </div>
  )
}

/** Evaluation methodology: weighted bar, formula, collapsible criteria. */
export function EvaluationView({ items }: { items: EvaluationMethodology[] }) {
  return (
    <div className={styles.stack}>
      {items.map((m, i) => (
        <EvaluationMethodologyCard key={i} m={m} />
      ))}
    </div>
  )
}

/* ---------- non-compliance penalties ---------- */

/** True when a penalty entry actually has something to show. */
function hasPenaltyContent(p?: NonCompliancePenalty): boolean {
  return Boolean(
    p &&
      (p.rule_description ||
        p.indicator_types ||
        p.max_penalty_percentage != null ||
        p.compliance_grade_formula),
  )
}

export function PenaltyView({ items }: { items: NonCompliancePenalty[] }) {
  const shown = items.filter(hasPenaltyContent)
  return (
    <div className={styles.stack}>
      {shown.map((p, i) => (
        <Card key={i}>
          {p.rule_description && <p className={styles.penRule}>{p.rule_description}</p>}
          {p.compliance_grade_formula && (
            <div className={styles.formula}>{p.compliance_grade_formula}</div>
          )}
          <DescriptionList
            items={[
              { label: 'Indicadores', value: orDash(p.indicator_types), mono: true },
              {
                label: 'Penalização máxima',
                value:
                  p.max_penalty_percentage != null
                    ? formatPercent(p.max_penalty_percentage)
                    : '—',
              },
            ]}
          />
        </Card>
      ))}
    </div>
  )
}

/* ---------- phases + phase areas ---------- */

/** Phases as a vertical timeline. */
export function PhasesTimeline({ phases }: { phases: Phase[] }) {
  return (
    <div className={styles.timeline}>
      {phases.map((p, i) => (
        <div key={i} className={styles.tItem}>
          <div className={styles.tName}>{p.name ?? `Fase ${i + 1}`}</div>
          <div className={styles.tDates}>
            {formatDate(p.start_date)} — {formatDate(p.end_date)}
          </div>
          {p.access_condition && (
            <div className={styles.tCond}>{p.access_condition}</div>
          )}
        </div>
      ))}
    </div>
  )
}

/** Dotações por área/fundo. When rows carry a `distribution` breakdown the
 *  segment names become dynamic columns (e.g. "Baixa Densidade" / "Outros"). */
export function PhaseAreasTable({
  areas,
  coveredAreas = [],
}: {
  areas: PhaseArea[]
  coveredAreas?: CoveredArea[]
}) {
  // area_id → geographic_area, so the label column names the actual region
  // instead of a repetitive fund_name ("Dotação Global" on every row).
  const areaNameById = new Map<number, string>()
  for (const c of coveredAreas) {
    if (c.id != null && c.geographic_area) areaNameById.set(c.id, c.geographic_area)
  }
  const labelFor = (a: PhaseArea): string | null =>
    (a.area_id != null ? areaNameById.get(a.area_id) : undefined) ?? a.fund_name ?? null

  const distNames: string[] = []
  let hasStringDist = false
  for (const a of areas) {
    if (Array.isArray(a.distribution)) {
      for (const d of a.distribution) {
        if (d?.name && !distNames.includes(d.name)) distNames.push(d.name)
      }
    } else if (typeof a.distribution === 'string' && a.distribution) {
      hasStringDist = true
    }
  }

  const columns: Column<PhaseArea>[] = [
    {
      key: 'fund',
      header: 'Fundo',
      primary: true,
      render: (a) => <strong>{orDash(labelFor(a))}</strong>,
    },
    ...distNames.map(
      (name): Column<PhaseArea> => ({
        key: `dist-${name}`,
        header: name,
        align: 'right',
        render: (a) => {
          const arr = Array.isArray(a.distribution) ? a.distribution : []
          const d = arr.find((x) => x?.name === name)
          return <span className="mono">{formatCurrency(parsePtNumber(d?.budget))}</span>
        },
      }),
    ),
    {
      key: 'total',
      header: 'Dotação total',
      align: 'right',
      render: (a) => <span className="mono">{formatCurrency(a.budget_allocation)}</span>,
    },
    {
      key: 'rate',
      header: 'Taxa máx.',
      align: 'right',
      render: (a) => <span className="mono">{formatPercent(a.max_financing_rate)}</span>,
    },
  ]

  if (hasStringDist && distNames.length === 0) {
    columns.splice(1, 0, {
      key: 'distribution',
      header: 'Distribuição',
      render: (a) => (typeof a.distribution === 'string' ? a.distribution : '—'),
    })
  }

  return (
    <DataTable
      columns={columns}
      rows={areas}
      rowKey={(_, i) => i}
      ariaLabel="Dotações por área e fundo"
    />
  )
}

/* ---------- expenses ---------- */

function expenseItems(items: unknown): string[] {
  if (!items) return []
  return Array.isArray(items) ? items.map(String) : [String(items)]
}

/** Two-column eligible / non-eligible expense lists. */
export function ExpenseColumns({
  eligible,
  ineligible,
}: {
  eligible?: ExpenseEntry[]
  ineligible?: ExpenseEntry[]
}) {
  const column = (groups: ExpenseEntry[] | undefined, ok: boolean) => (
    <Card>
      <h4 className={ok ? styles.expOk : styles.expNo}>
        {ok ? '✓ Elegíveis' : '✕ Não elegíveis'}
      </h4>
      {groups && groups.length > 0 ? (
        <div className={styles.expGroups}>
          {groups.map((g, i) =>
            typeof g === 'string' ? (
              <ul key={i} className={styles.expList}>
                <li>{g}</li>
              </ul>
            ) : (
              <div key={i}>
                {g.category && <div className={styles.expCat}>{g.category}</div>}
                <ul className={styles.expList}>
                  {expenseItems(g.items).map((it, j) => (
                    <li key={j}>{it}</li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </div>
      ) : (
        <p className={styles.expEmpty}>Sem informação.</p>
      )}
    </Card>
  )
  return (
    <div className={styles.expGrid}>
      {column(eligible, true)}
      {column(ineligible, false)}
    </div>
  )
}

function ExpenseLimitItem({ x }: { x: ExpenseLimit }) {
  const [open, setOpen] = useState(false)
  const limit =
    x.max_absolute_value != null
      ? formatCurrency(x.max_absolute_value)
      : x.max_percentage_value != null
        ? `≤ ${formatPercent(x.max_percentage_value)}`
        : x.applicable_ocs_methodology
          ? 'OCS'
          : '—'
  const hasDetails = Boolean(
    x.calculation_base || x.specific_conditions || x.applicable_ocs_methodology,
  )
  return (
    <div className={styles.limItem}>
      <button
        type="button"
        className={styles.limHead}
        onClick={() => hasDetails && setOpen((v) => !v)}
        aria-expanded={hasDetails ? open : undefined}
        disabled={!hasDetails}
      >
        <span className={styles.limCat}>{orDash(x.expense_category)}</span>
        <span className={styles.limVal}>{limit}</span>
        {hasDetails && (
          <span className={cx(styles.chev, open && styles.chevOpen)} aria-hidden="true">
            ›
          </span>
        )}
      </button>
      {open && hasDetails && (
        <div className={styles.limBody}>
          {x.applicable_ocs_methodology && (
            <p>
              <b>Metodologia:</b> {x.applicable_ocs_methodology}
            </p>
          )}
          {x.calculation_base && (
            <p>
              <b>Base de cálculo:</b> {x.calculation_base}
            </p>
          )}
          {x.specific_conditions && <p>{x.specific_conditions}</p>}
        </div>
      )}
    </div>
  )
}

/** Limites de despesa: category + limit, with expandable details. */
export function ExpenseLimits({ items }: { items: ExpenseLimit[] }) {
  return (
    <div className={styles.limStack}>
      {items.map((x, i) => (
        <ExpenseLimitItem key={i} x={x} />
      ))}
    </div>
  )
}

/* ---------- legislation ---------- */

export function LegislationList({ items }: { items: Array<LegislationEntry | string> }) {
  return (
    <div className={styles.legStack}>
      {items.map((entry, i) =>
        typeof entry === 'string' ? (
          <div key={i} className={styles.leg}>
            <div className={styles.legName}>{entry}</div>
          </div>
        ) : (
          <div key={i} className={styles.leg}>
            <div className={styles.legName}>{orDash(entry.regulation_name)}</div>
            {entry.refers_to && <div className={styles.legRefers}>{entry.refers_to}</div>}
            {entry.articles?.map((a, j) => (
              <div key={j} className={styles.legArt}>
                {a.article && <b>{a.article}</b>}
                <span>{orDash(a.refers_to)}</span>
              </div>
            ))}
          </div>
        ),
      )}
    </div>
  )
}

/* ---------- documents ---------- */

/** Document download list (aside). */
export function DocumentsList({ documents }: { documents: GrantDocument[] }) {
  return (
    <div className={styles.docs}>
      {documents.map((d, i) => {
        const label = d.name || d.doc_type || 'Documento'
        return d.url ? (
          <a
            key={i}
            className={styles.docLink}
            href={apiUrl(d.url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.docIcon} aria-hidden="true">
              ↧
            </span>
            <span className={styles.docText}>
              <span className={styles.docName}>{label}</span>
              {d.doc_type && <span className={styles.docType}>{d.doc_type}</span>}
            </span>
            <span className={styles.docArrow} aria-hidden="true">
              ↗
            </span>
          </a>
        ) : (
          <div key={i} className={styles.docLink}>
            <span className={styles.docIcon} aria-hidden="true">
              ✎
            </span>
            <span className={styles.docText}>
              <span className={styles.docName}>{label}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- text blocks / indicators / documents / contacts ---------- */

/** Bulleted (or numbered) list of plain-text items. */
export function TextList({ items, ordered = false }: { items: string[]; ordered?: boolean }) {
  if (ordered) return <CriteriaList items={items} />
  return (
    <ul className={styles.bullets}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  )
}

/** Geographic areas (covered_areas) as chips. */
export function AreaChips({ areas }: { areas: CoveredArea[] }) {
  const names = areas.map((a) => a.geographic_area).filter((n): n is string => Boolean(n))
  if (names.length === 0) return null
  return (
    <Chips>
      {names.map((n, i) => (
        <Tag key={i}>{n}</Tag>
      ))}
    </Chips>
  )
}

/** Beneficiaries grouped by action type. */
export function BeneficiariesByAction({ items }: { items: BeneficiaryByAction[] }) {
  return (
    <div className={styles.stack}>
      {items.map((b, i) => (
        <Card key={i}>
          {b.action_type && <div className={styles.baAction}>{b.action_type}</div>}
          {b.entities && b.entities.length > 0 && (
            <ul className={styles.bullets}>
              {b.entities.map((e, j) => (
                <li key={j}>{e}</li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  )
}

/** Realização / Resultado / Acompanhamento indicator groups. */
export function IndicatorGroups({
  output,
  result,
  monitoring,
}: {
  output?: Indicator[]
  result?: Indicator[]
  monitoring?: Indicator[]
}) {
  const groups = [
    { label: 'Realização', items: output ?? [] },
    { label: 'Resultado', items: result ?? [] },
    { label: 'Acompanhamento', items: monitoring ?? [] },
  ].filter((g) => g.items.length > 0)
  return (
    <div className={styles.igroups}>
      {groups.map((g) => (
        <div key={g.label} className={styles.igroup}>
          <div className={styles.igLabel}>{g.label}</div>
          <div className={styles.iList}>
            {g.items.map((ind, i) => (
              <div key={i} className={styles.iItem}>
                <div className={styles.iHead}>
                  <code className={styles.iCode}>{orDash(ind.indicator_code)}</code>
                  {ind.unit_of_measure && (
                    <span className={styles.iUnit}>{ind.unit_of_measure}</span>
                  )}
                </div>
                {ind.description && <div className={styles.iDesc}>{ind.description}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Documentos de candidatura — names only. */
export function ApplicationDocuments({ items }: { items: ApplicationDocument[] }) {
  return (
    <ul className={styles.appDocs}>
      {items.map((d, i) => (
        <li key={i} className={styles.appDoc}>
          <span className={styles.appDocDot} aria-hidden="true" />
          <span>{orDash(d.name)}</span>
        </li>
      ))}
    </ul>
  )
}

function parseContact(s: string): { name: string; fields: { k: string; v: string }[] } {
  const segs = s
    .split('|')
    .map((x) => x.trim())
    .filter(Boolean)
  let name = ''
  const fields: { k: string; v: string }[] = []
  for (const seg of segs) {
    const m = seg.match(/^([^:]+):\s*(.*)$/)
    if (m) {
      const v = m[2].trim()
      if (v) fields.push({ k: m[1].trim(), v })
      else if (!name) name = m[1].replace(/\s*[-–]\s*Respons[aá]vel\s*$/i, '').trim()
    } else if (!name) {
      name = seg
    }
  }
  return { name, fields }
}

function contactValue(k: string, v: string): ReactNode {
  if (/email|correio/i.test(k)) return <a href={`mailto:${v}`}>{v}</a>
  if (/telefone|phone|tel\b/i.test(k)) return <a href={`tel:${v.replace(/\s+/g, '')}`}>{v}</a>
  return v
}

export function ContactCard({ items }: { items: string[] }) {
  const seen = new Set<string>()
  const contacts = items
    .map(parseContact)
    .filter((c) => {
      if (!c.name && c.fields.length === 0) return false
      const key = `${c.name}|${c.fields.map((f) => f.v).join(',')}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  if (contacts.length === 0) return null
  return (
    <div className={styles.contactList}>
      {contacts.map((c, i) => (
        <div key={i} className={styles.contact}>
          {c.name && <div className={styles.contactName}>{c.name}</div>}
          {c.fields.map((f, j) => (
            <div key={j} className={styles.contactRow}>
              {f.k && <span className={styles.contactK}>{f.k}</span>}
              <span className={styles.contactV}>{contactValue(f.k, f.v)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
