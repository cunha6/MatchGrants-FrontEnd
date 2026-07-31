import { useMemo, useState } from 'react'
import { listGrants } from '../api'
import type { GrantListItem } from '../types'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
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
import { ENTITY_SIZE_OPTIONS, type EntitySize } from '../../../shared/constants/domain'
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
  const [active, setActive] = useState<'true' | 'false' | 'all'>('true')
  const [search, setSearch] = useState('')
  const [cae, setCae] = useState('')
  const [region, setRegion] = useState('')
  const [dimension, setDimension] = useState<EntitySize | ''>('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState | null>(null)
  const debouncedSearch = useDebouncedValue(search, 400)
  const debouncedCae = useDebouncedValue(cae, 400)
  const debouncedRegion = useDebouncedValue(region, 400)

  // Everything below is applied server-side, over the whole table — not just
  // the loaded page.
  const params = useMemo(
    () => ({
      active,
      page,
      page_size: PAGE_SIZE,
      order_by: orderByFor(sort),
      q: debouncedSearch.trim() || undefined,
      cae: debouncedCae.trim() || undefined,
      region: debouncedRegion.trim() || undefined,
      dimension: dimension || undefined,
    }),
    [active, page, sort, debouncedSearch, debouncedCae, debouncedRegion, dimension],
  )

  const { data, loading, error, reload } = useApiQuery(
    (signal) => listGrants(params, signal),
    [params],
  )

  const resetPage = () => setPage(1)
  const hasFilters = Boolean(search || cae || region || dimension)

  return (
    <div>
      <PageHeader eyebrow="Financiamento público" title="Avisos" />

      <div className={listStyles.toolbar}>
        <div className={listStyles.grow}>
          <Input
            label="Pesquisar (código / título)"
            placeholder="Ex.: ALGARVE-2026-5"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              resetPage()
            }}
          />
        </div>

        <div className={listStyles.narrow}>
          <Input
            label="CAE elegível"
            placeholder="Ex.: 55849"
            value={cae}
            onChange={(e) => {
              setCae(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className={listStyles.narrow}>
          <Input
            label="Região"
            placeholder="Ex.: Norte, Porto, Algarve"
            value={region}
            onChange={(e) => {
              setRegion(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className={listStyles.narrow}>
          <Select
            label="Dimensão"
            placeholder="Todas"
            value={dimension}
            onChange={(e) => {
              setDimension(e.target.value as EntitySize | '')
              resetPage()
            }}
            options={ENTITY_SIZE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        <div className={listStyles.narrow}>
          <Select
            label="Estado"
            value={active}
            onChange={(e) => {
              setActive(e.target.value as typeof active)
              resetPage()
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
      ) : data && data.grants.length > 0 ? (
        <div className={loading ? listStyles.stale : undefined}>
          <DataTable
            columns={columns}
            rows={data.grants}
            rowKey={(g) => g.id}
            rowHref={(g) => `/avisos/${g.id}`}
            getRowAriaLabel={(g) => g.title}
            ariaLabel="Lista de avisos"
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
          title="Sem avisos"
          message={
            hasFilters
              ? 'Nenhum aviso corresponde aos critérios.'
              : 'Nenhum aviso corresponde ao estado selecionado.'
          }
        />
      )}
    </div>
  )
}
