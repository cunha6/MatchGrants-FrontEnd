import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getWeeklyNews } from '../api'
import type { PlannedGrant } from '../types'
import type { Grant } from '../../avisos/types'
import type { Notice } from '../../anuncios/types'
import { useAuth } from '../../auth/AuthContext'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  Card,
  type Column,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  Pagination,
  Section,
  Select,
  type SortState,
} from '../../../shared/components'
import { formatCurrency, formatDate, formatPercent, orDash } from '../../../shared/utils/format'
import { toStringArray } from '../../../shared/utils/collections'
import { cx } from '../../../shared/utils/cx'
import listStyles from '../../../shared/styles/list.module.css'
import styles from './newsletter.module.css'

const PAGE_SIZE = 20

/** Normalise a date that may be ISO (YYYY-MM-DD), free text ("30/09/2026") or
 *  null into a sortable timestamp (null sorts last). */
function toTs(value: string | null | undefined): number | null {
  if (!value) return null
  const s = String(value).trim()
  // European free-text dates first (dd/mm/yyyy) — otherwise Date.parse would
  // read "1/5/2026" as US m/d (5 Jan) instead of 1 May.
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) {
    const t = Date.parse(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`)
    if (!Number.isNaN(t)) return t
  }
  const iso = Date.parse(s)
  return Number.isNaN(iso) ? null : iso
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/**
 * Client-side approximation of the /avisos/list/ CAE prefix rule: an aviso
 * with no included_caes is open to every CAE; otherwise it matches if either
 * side (query or stored entry, wildcard "***" stripped) is a prefix of the
 * other — e.g. stored "55***" matches query "55849"; stored "55847" does not
 * match query "55848".
 */
function matchesCae(grant: Grant, query: string): boolean {
  const entries = toStringArray(grant.included_caes)
  if (entries.length === 0) return true
  const q = query.trim()
  if (!q) return true
  return entries.some((raw) => {
    const stored = raw.replace(/\*+$/, '')
    return q.startsWith(stored) || stored.startsWith(q)
  })
}

/** Client-side approximation of the /avisos/list/ region rule: open to all if
 *  the aviso has no eligible_regions/covered_areas; otherwise a case-insensitive
 *  substring match against either. */
function matchesRegion(grant: Grant, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const regions = toStringArray(grant.eligible_regions)
  const areas = (grant.covered_areas ?? [])
    .map((a) => a.geographic_area)
    .filter((v): v is string => Boolean(v))
  if (regions.length === 0 && areas.length === 0) return true
  return [...regions, ...areas].some((r) => r.toLowerCase().includes(q))
}

/** Ascending/descending compare with nulls always pushed to the end. */
function cmp(a: number | null, b: number | null, dir: 'asc' | 'desc'): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  return dir === 'asc' ? a - b : b - a
}

/* ---------------- Novos avisos: search + sort + pagination ---------------- */

const grantColumns: Column<Grant>[] = [
  { key: 'grant_code', header: 'Código', render: (g) => <span className="mono">{g.grant_code}</span> },
  { key: 'title', header: 'Título', primary: true, render: (g) => g.title },
  { key: 'closing_date', header: 'Encerramento', sortable: true, render: (g) => formatDate(g.closing_date) },
  {
    key: 'total_allocation',
    header: 'Dotação',
    align: 'right',
    sortable: true,
    render: (g) => formatCurrency(g.total_allocation),
  },
  { key: 'financing_rate', header: 'Taxa', align: 'right', render: (g) => formatPercent(g.financing_rate) },
]

function NewGrantsTable({ grants }: { grants: Grant[] }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [cae, setCae] = useState('')
  const [region, setRegion] = useState('')
  const [sort, setSort] = useState<SortState | null>(null)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return grants.filter((g) => {
      if (q && !`${g.title ?? ''} ${g.objective ?? ''}`.toLowerCase().includes(q)) return false
      if (!matchesCae(g, cae)) return false
      if (!matchesRegion(g, region)) return false
      return true
    })
  }, [grants, search, cae, region])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const arr = [...filtered]
    arr.sort((a, b) => {
      if (sort.key === 'closing_date') return cmp(toTs(a.closing_date), toTs(b.closing_date), sort.dir)
      if (sort.key === 'total_allocation') {
        return cmp(numOrNull(a.total_allocation), numOrNull(b.total_allocation), sort.dir)
      }
      return 0
    })
    return arr
  }, [filtered, sort])

  const numPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, numPages)
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <>
      <div className={listStyles.toolbar}>
        <div className={listStyles.grow}>
          <Input
            label="Pesquisar (Código / título)"
            placeholder="Ex.: habitação"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className={listStyles.shrink}>
          <Input
            label="CAE elegível"
            placeholder="Ex.: 55849"
            value={cae}
            onChange={(e) => {
              setCae(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <div className={listStyles.shrink}>
          <Input
            label="Região"
            placeholder="Ex.: Norte, Porto, Algarve"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>
      <DataTable
        columns={grantColumns}
        rows={pageRows}
        rowKey={(g) => g.id}
        onRowClick={(g) => navigate(`/avisos/${g.id}`)}
        ariaLabel="Novos avisos"
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(1)
        }}
      />
      <Pagination
        page={safePage}
        numPages={numPages}
        total={sorted.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />
    </>
  )
}

/* -------- Novos anúncios: search + sort + act_type/contract_types + page ---- */

const noticeColumns: Column<Notice>[] = [
  { key: 'entity_name', header: 'Entidade', primary: true, render: (n) => n.entity_name },
  { key: 'description', header: 'Descrição', render: (n) => orDash(n.description) },
  {
    key: 'base_price',
    header: 'Preço base',
    align: 'right',
    sortable: true,
    render: (n) => formatCurrency(n.base_price),
  },
  {
    key: 'proposal_deadline',
    header: 'Prazo propostas',
    sortable: true,
    render: (n) => formatDate(n.proposal_deadline),
  },
]

function NewAnnouncementsTable({ announcements }: { announcements: Notice[] }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [actType, setActType] = useState('')
  const [contractType, setContractType] = useState('')
  const [sort, setSort] = useState<SortState | null>(null)
  const [page, setPage] = useState(1)

  const actTypeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const n of announcements) if (n.act_type) set.add(n.act_type)
    return [...set].sort()
  }, [announcements])

  const contractTypeOptions = useMemo(() => {
    const set = new Set<string>()
    for (const n of announcements) toStringArray(n.contract_types).forEach((c) => set.add(c))
    return [...set].sort()
  }, [announcements])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return announcements.filter((n) => {
      if (q) {
        const hay = `${n.notice_number ?? ''} ${n.entity_name ?? ''} ${n.description ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (actType && n.act_type !== actType) return false
      if (contractType && !toStringArray(n.contract_types).includes(contractType)) return false
      return true
    })
  }, [announcements, search, actType, contractType])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const arr = [...filtered]
    arr.sort((a, b) => {
      if (sort.key === 'base_price') return cmp(numOrNull(a.base_price), numOrNull(b.base_price), sort.dir)
      if (sort.key === 'proposal_deadline') {
        return cmp(toTs(a.proposal_deadline), toTs(b.proposal_deadline), sort.dir)
      }
      return 0
    })
    return arr
  }, [filtered, sort])

  const numPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, numPages)
  const pageRows = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const resetPage = () => setPage(1)

  return (
    <>
      <div className={listStyles.toolbar}>
        <div className={listStyles.grow}>
          <Input
            label="Pesquisar (n.º / entidade / descrição)"
            placeholder="Ex.: manutenção, Loulé, 16932/2026"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className={listStyles.shrink}>
          <Select
            label="Tipo de ato"
            placeholder="Todos"
            value={actType}
            onChange={(e) => {
              setActType(e.target.value)
              resetPage()
            }}
            options={actTypeOptions.map((v) => ({ value: v, label: v }))}
          />
        </div>
        <div className={listStyles.shrink}>
          <Select
            label="Tipo de contrato"
            placeholder="Todos"
            value={contractType}
            onChange={(e) => {
              setContractType(e.target.value)
              resetPage()
            }}
            options={contractTypeOptions.map((v) => ({ value: v, label: v }))}
          />
        </div>
      </div>
      <DataTable
        columns={noticeColumns}
        rows={pageRows}
        rowKey={(n) => n.id}
        onRowClick={(n) => navigate(`/anuncios/${n.id}`)}
        ariaLabel="Novas Contratações Publicas"
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          resetPage()
        }}
      />
      <Pagination
        page={safePage}
        numPages={numPages}
        total={sorted.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />
    </>
  )
}

/* ---------------- Cards for updated / coming-next ---------------- */

function GrantCard({ grant }: { grant: Grant }) {
  return (
    <Link to={`/avisos/${grant.id}`} style={{ textDecoration: 'none' }}>
      <Card interactive className={styles.card}>
        <span className={styles.code}>{grant.grant_code}</span>
        <span className={styles.cardTitle}>{grant.title}</span>
        <span className={styles.line}>
          <span>Encerra: {formatDate(grant.closing_date)}</span>
          <span>{formatCurrency(grant.total_allocation)}</span>
          <span>{formatPercent(grant.financing_rate)}</span>
        </span>
      </Card>
    </Link>
  )
}

function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <Link to={`/anuncios/${notice.id}`} style={{ textDecoration: 'none' }}>
      <Card interactive className={styles.card}>
        <span className={styles.code}>N.º {notice.notice_number}</span>
        <span className={styles.cardTitle}>{notice.entity_name}</span>
        <span className={styles.line}>{notice.description}</span>
        <span className={cx(styles.line, styles.lineEnd)}>
          <span><strong>Preço: </strong>{formatCurrency(notice.base_price)}</span>
          <span><strong>Prazo: </strong>{formatDate(notice.proposal_deadline)}</span>
        </span>
      </Card>
    </Link>
  )
}

function PlannedCard({ item }: { item: PlannedGrant }) {
  const scope = [item.programme, item.fund, item.nuts].filter(Boolean).join(' · ')
  return (
    <Card className={styles.card}>
      <span className={styles.cardTitle}>{item.designation}</span>
      {scope && <span className={styles.k}>{scope}</span>}
      <span className={styles.line}>
        <span>Abertura: {formatDate(item.expected_start)}</span>
        {item.budget != null && <span>{formatCurrency(item.budget)}</span>}
      </span>
    </Card>
  )
}

export function Newsletter() {
  const { hasRole } = useAuth()
  /** commercial_grants only sees avisos news; commercial_public (and admin) see both. */
  const canSeeNotices = hasRole('admin', 'commercial_public')
  const { data, loading, error, reload } = useApiQuery((signal) => getWeeklyNews(signal), [])
  const [activeTab, setActiveTab] = useState<'grants' | 'announcements'>('grants')

  if (loading) return <LoadingBlock message="A carregar a newsletter…" />
  if (error) return <ErrorState error={error} onRetry={reload} />
  if (!data) return null

  const { new_grants, new_notices: new_announcements, coming_next_30_days } = data
  // The newsletter only reports automated updates — a human edit (last_update_source
  // "manual") is a deliberate, reviewed change, not "news" to broadcast.
  const updated_grants = data.updated_grants.filter((g) => g.last_update_source === 'scrape')
  const updated_announcements = data.updated_notices.filter(
    (n) => n.last_update_source === 'scrape',
  )

  const isEmpty =
    new_grants.length === 0 &&
    updated_grants.length === 0 &&
    coming_next_30_days.length === 0 &&
    (!canSeeNotices || (new_announcements.length === 0 && updated_announcements.length === 0))

  return (
    <div>
      <PageHeader
        eyebrow="Novidades da semana"
        title="Newsletter"
        description="Avisos e Contratações Publicas novos ou atualizados nos últimos 7 dias, e o que abre nos próximos 30."
      />

      <p className={styles.generated}>Gerada a {formatDate(data.generated_at)}</p>

      {isEmpty ? (
        <EmptyState
          title="Sem novidades esta semana"
          message="Não há avisos nem Contratações Publicas novos ou atualizados nos últimos 7 dias."
        />
      ) : (
        <>
          <div className={styles.navbar}>
            <button
              type="button"
              onClick={() => setActiveTab('grants')}
              className={activeTab === 'grants' ? styles.activeTab : styles.tab}
            >
              Avisos ({new_grants.length + updated_grants.length + coming_next_30_days.length})
            </button>
            {canSeeNotices && (
              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className={activeTab === 'announcements' ? styles.activeTab : styles.tab}
              >
                Contratações Publicas ({new_announcements.length + updated_announcements.length})
              </button>
            )}
          </div>

          {activeTab === 'grants' && (
            <div>
              {new_grants.length > 0 && (
                <div className={styles.section}>
                  <Section eyebrow={`${new_grants.length} novo(s)`} title="Novos avisos">
                    <NewGrantsTable grants={new_grants} />
                  </Section>
                </div>
              )}

              {updated_grants.length > 0 && (
                <div className={styles.section}>
                  <Section eyebrow={`${updated_grants.length} atualizado(s)`} title="Avisos atualizados">
                    <div className={styles.grid}>
                      {updated_grants.map((g) => (
                        <GrantCard key={g.id} grant={g} />
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {coming_next_30_days.length > 0 && (
                <div className={styles.section}>
                  <Section
                    eyebrow={`${coming_next_30_days.length} previsto(s)`}
                    title="A abrir nos próximos 30 dias"
                  >
                    <div className={styles.grid}>
                      {coming_next_30_days.map((item) => (
                        <PlannedCard key={item.id} item={item} />
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {new_grants.length === 0 &&
                updated_grants.length === 0 &&
                coming_next_30_days.length === 0 && (
                  <EmptyState title="Sem avisos" message="Nenhum aviso novo, atualizado ou previsto." />
                )}
            </div>
          )}

          {canSeeNotices && activeTab === 'announcements' && (
            <div>
              {new_announcements.length > 0 && (
                <div className={styles.section}>
                  <Section eyebrow={`${new_announcements.length} novo(s)`} title="Novas Contratações Publicas">
                    <NewAnnouncementsTable announcements={new_announcements} />
                  </Section>
                </div>
              )}

              {updated_announcements.length > 0 && (
                <div className={styles.section}>
                  <Section
                    eyebrow={`${updated_announcements.length} atualizado(s)`}
                    title="Contratações Publicas atualizadas"
                  >
                    <div className={styles.grid}>
                      {updated_announcements.map((n) => (
                        <NoticeCard key={n.id} notice={n} />
                      ))}
                    </div>
                  </Section>
                </div>
              )}

              {new_announcements.length === 0 && updated_announcements.length === 0 && (
                <EmptyState title="Sem Contratações Publicas" message="Nenhuma Contratação Publica nova ou atualizada." />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
