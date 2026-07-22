import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listNotices } from '../api'
import type { NoticeListItem } from '../types'
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
  type SortState,
} from '../../../shared/components'
import { formatCurrency, formatDate, orDash } from '../../../shared/utils/format'
import listStyles from '../../../shared/styles/list.module.css'

const PAGE_SIZE = 20

/** Maps a clicked column + direction to the API's order_by enum. `undefined`
 *  (no sort selected) lets the server fall back to its own default. */
function orderByFor(sort: SortState | null): string | undefined {
  if (!sort) return undefined
  switch (sort.key) {
    case 'base_price':
      return sort.dir === 'asc' ? 'price_lowest' : 'price_highest'
    case 'proposal_deadline':
      return sort.dir === 'asc' ? 'deadline_earliest' : 'deadline_latest'
    default:
      return undefined
  }
}

const columns: Column<NoticeListItem>[] = [
  {
    key: 'notice_number',
    header: 'N.º anúncio',
    render: (n) => <span className="mono">{n.notice_number}</span>,
  },
  { key: 'entity_name', header: 'Entidade', primary: true, render: (n) => n.entity_name },
  { key: 'act_type', header: 'Tipo de ato', render: (n) => orDash(n.act_type) },
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
  { key: 'active', header: 'Estado', render: (n) => <ActiveBadge active={n.active} /> },
]

export function AnunciosList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState | null>(null)

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, order_by: orderByFor(sort) }),
    [page, sort],
  )

  const { data, loading, error, reload } = useApiQuery(
    (signal) => listNotices(params, signal),
    [params],
  )

  // Search only filters the rows already loaded for the current page — the
  // API has no free-text search param, so it can't reach across pages.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!data) return []
    if (!q) return data.notices
    return data.notices.filter((n) => n.notice_number.toLowerCase().includes(q))
  }, [data, search])

  return (
    <div>
      <PageHeader eyebrow="Contratação pública" title="Anúncios" />

      <div className={listStyles.toolbar}>
        <div className={listStyles.grow}>
          <Input
            label="Pesquisar n.º anúncio"
            placeholder="Ex.: 16932/2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && !data ? (
        <LoadingBlock message="A carregar anúncios…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : rows.length > 0 ? (
        <div className={loading ? listStyles.stale : undefined}>
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(n) => n.id}
            onRowClick={(n) => navigate(`/anuncios/${n.id}`)}
            ariaLabel="Lista de anúncios"
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
          title="Sem anúncios"
          message={
            search
              ? 'Nenhum anúncio corresponde à pesquisa nesta página.'
              : 'Nenhum anúncio disponível.'
          }
        />
      )}
    </div>
  )
}
