import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listGrants } from '../api'
import type { GrantListItem } from '../types'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  ActiveBadge,
  type Column,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  Pagination,
  Select,
  type SortState,
} from '../../../shared/components'
import {
  formatCurrency,
  formatDate,
  formatPercent,
} from '../../../shared/utils/format'
import listStyles from '../../../shared/styles/list.module.css'

const PAGE_SIZE = 20

/** Maps a clicked column + direction to the API's order_by enum. `undefined`
 *  (no sort selected) lets the server fall back to its own default. */
function orderByFor(sort: SortState | null): string | undefined {
  if (!sort) return undefined
  switch (sort.key) {
    case 'total_allocation':
      return sort.dir === 'asc' ? 'allocation_lowest' : 'allocation_highest'
    case 'financing_rate':
      return sort.dir === 'asc' ? 'rate_lowest' : 'rate_highest'
    case 'closing_date':
      return sort.dir === 'asc' ? 'closing_earliest' : 'closing_latest'
    default:
      return undefined
  }
}

const columns: Column<GrantListItem>[] = [
  {
    key: 'grant_code',
    header: 'Código',
    render: (g) => <span className="mono">{g.grant_code}</span>,
  },
  { key: 'title', header: 'Título', primary: true, render: (g) => g.title },
  {
    key: 'total_allocation',
    header: 'Dotação',
    align: 'right',
    sortable: true,
    render: (g) => formatCurrency(g.total_allocation),
  },
  {
    key: 'financing_rate',
    header: 'Taxa',
    align: 'right',
    sortable: true,
    render: (g) => formatPercent(g.financing_rate),
  },
  {
    key: 'closing_date',
    header: 'Encerramento',
    sortable: true,
    render: (g) => formatDate(g.closing_date),
  },
  {
    key: 'next_phase_date',
    header: 'Próxima fase',
    render: (g) => formatDate(g.next_phase_date),
  },
  {
    key: 'active',
    header: 'Estado',
    render: (g) => <ActiveBadge active={g.active} />,
  },
]

export function AvisosList() {
  const navigate = useNavigate()
  const [active, setActive] = useState<'true' | 'false' | 'all'>('true')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState | null>(null)

  const params = useMemo(
    () => ({ active, page, page_size: PAGE_SIZE, order_by: orderByFor(sort) }),
    [active, page, sort],
  )

  const { data, loading, error, reload } = useApiQuery(
    (signal) => listGrants(params, signal),
    [params],
  )

  // Search only filters the rows already loaded for the current page — the
  // API has no free-text search param, so it can't reach across pages.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!data) return []
    if (!q) return data.grants
    return data.grants.filter((g) => g.grant_code.toLowerCase().includes(q))
  }, [data, search])

  return (
    <div>
      <PageHeader eyebrow="Financiamento público" title="Avisos" />

      <div className={listStyles.toolbar}>
        <div className={listStyles.grow}>
          <Input
            label="Pesquisar código"
            placeholder="Ex.: ALGARVE-2026-5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={listStyles.shrink}>
          <Select
            label="Estado"
            value={active}
            onChange={(e) => {
              setActive(e.target.value as typeof active)
              setPage(1)
            }}
            options={[
              { value: 'true', label: 'Ativos' },
              { value: 'false', label: 'Inativos' },
              { value: 'all', label: 'Todos' },
            ]}
          />
        </div>
      </div>

      {loading && !data ? (
        <LoadingBlock message="A carregar avisos…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length > 0 ? (
        <div className={loading ? listStyles.stale : undefined}>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(g) => g.id}
            onRowClick={(g) => navigate(`/avisos/${g.id}`)}
            ariaLabel="Lista de avisos"
            sort={sort}
            onSortChange={(next) => {
              setSort(next)
              setPage(1)
            }}
          />
          <Pagination
            page={data!.page}
            numPages={data!.num_pages}
            total={data!.total}
            pageSize={data!.page_size}
            onPage={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title="Sem avisos"
          message={
            search
              ? 'Nenhum aviso corresponde à pesquisa nesta página.'
              : 'Nenhum aviso corresponde ao estado selecionado.'
          }
        />
      )}
    </div>
  )
}
