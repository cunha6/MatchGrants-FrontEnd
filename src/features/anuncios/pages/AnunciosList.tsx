import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getNoticeFilters, listNotices } from '../api'
import type { NoticeListItem } from '../types'
import { NoticeStatusBadge } from '../components/NoticeStatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import {
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
import { formatCurrency, formatDate, orDash } from '../../../shared/utils/format'
import listStyles from '../../../shared/styles/list.module.css'

/** Dedupe + sort — the API's act_types come back with repeats (one per
 *  matching anúncio), contract_types don't; sorting either way is harmless. */
function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'pt'))
}

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
  { key: 'status', header: 'Estado', render: (n) => <NoticeStatusBadge status={n.status} /> },
]

export function AnunciosList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [actType, setActType] = useState('')
  const [contractType, setContractType] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState | null>(null)
  const debouncedSearch = useDebouncedValue(search, 400)

  // Search, act_type, contract_type, status and order_by are all applied
  // server-side, over the whole table — not just the loaded page.
  const params = useMemo(
    () => ({
      page,
      page_size: PAGE_SIZE,
      order_by: orderByFor(sort),
      q: debouncedSearch.trim() || undefined,
      act_type: actType || undefined,
      contract_type: contractType || undefined,
      status: status || undefined,
    }),
    [page, sort, debouncedSearch, actType, contractType, status],
  )

  const { data, loading, error, reload } = useApiQuery(
    (signal) => listNotices(params, signal),
    [params],
  )

  // Fetched once — options for the two filter <select>s (never a value that
  // would give zero results, and picks up new imported values automatically).
  const { data: filterOptions } = useApiQuery(
    (signal) => getNoticeFilters(signal),
    [],
  )
  const actTypeOptions = useMemo(
    () => uniqueSorted(filterOptions?.act_types ?? []),
    [filterOptions],
  )
  const contractTypeOptions = useMemo(
    () => uniqueSorted(filterOptions?.contract_types ?? []),
    [filterOptions],
  )

  const resetPage = () => setPage(1)

  return (
    <div>
      <PageHeader eyebrow="Contratação pública" title="Contratações Publicas" />

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
        <div className={listStyles.narrow}>
          <Select
            label="Estado"
            placeholder="Todos"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              resetPage()
            }}
            options={filterOptions?.statuses ?? []}
          />
        </div>
      </div>

      {loading && !data ? (
        <LoadingBlock message="A carregar contratações públicas…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.notices.length > 0 ? (
        <div className={loading ? listStyles.stale : undefined}>
          <DataTable
            columns={columns}
            rows={data.notices}
            rowKey={(n) => n.id}
            onRowClick={(n) => navigate(`/anuncios/${n.id}`)}
            ariaLabel="Lista de Contratações Publicas"
            sort={sort}
            onSortChange={(next) => {
              setSort(next)
              resetPage()
            }}
          />
          <Pagination
            page={data.page}
            numPages={data.num_pages}
            total={data.total}
            pageSize={data.page_size}
            onPage={setPage}
          />
        </div>
      ) : (
        <EmptyState
          title="Sem anúncios"
          message={
            search || actType || contractType || status
              ? 'Nenhum anúncio corresponde aos critérios.'
              : 'Nenhum anúncio disponível.'
          }
        />
      )}
    </div>
  )
}
