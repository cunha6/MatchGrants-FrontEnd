import { useMemo, useState } from 'react'
import { listPlannedGrants, syncPlannedGrants } from '../api'
import type { PlannedGrant } from '../types'
import { useAuth } from '../../auth/AuthContext'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  Alert,
  Button,
  type Column,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Pagination,
  type SortState,
  Spinner,
} from '../../../shared/components'
import { formatCurrency, formatDate, orDash } from '../../../shared/utils/format'
import { ApiError } from '../../../api/client'
import styles from './newsletter.module.css'

const PAGE_SIZE = 25

/** Maps a clicked column + direction to the API's order_by enum. `undefined`
 *  (no sort selected) lets the server fall back to its own default
 *  (start_earliest — an unknown value falls back the same way). */
function orderByFor(sort: SortState | null): string | undefined {
  if (!sort) return undefined
  switch (sort.key) {
    case 'expected_start':
      return sort.dir === 'asc' ? 'start_earliest' : 'start_latest'
    case 'expected_end':
      return sort.dir === 'asc' ? 'end_earliest' : 'end_latest'
    case 'budget':
      return sort.dir === 'asc' ? 'allocation_lowest' : 'allocation_highest'
    default:
      return undefined
  }
}

const columns: Column<PlannedGrant>[] = [
  { key: 'designation', header: 'Designação', primary: true, render: (p) => p.designation },
  { key: 'programme', header: 'Programa', render: (p) => orDash(p.programme) },
  { key: 'fund', header: 'Fundo', render: (p) => orDash(p.fund) },
  { key: 'nuts', header: 'NUTS', render: (p) => orDash(p.nuts) },
  {
    key: 'expected_start',
    header: 'Abertura prevista',
    sortable: true,
    render: (p) => formatDate(p.expected_start),
  },
  {
    key: 'expected_end',
    header: 'Fim previsto',
    sortable: true,
    render: (p) => formatDate(p.expected_end),
  },
  {
    key: 'budget',
    header: 'Dotação',
    align: 'right',
    sortable: true,
    render: (p) => formatCurrency(p.budget),
  },
]

export function PlannedGrants() {
  const { hasRole } = useAuth()
  const canSync = hasRole('admin', 'commercial_grants', 'commercial_public')

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const params = useMemo(
    () => ({ page, page_size: PAGE_SIZE, order_by: orderByFor(sort) }),
    [page, sort],
  )
  const { data, loading, error, reload } = useApiQuery(
    (signal) => listPlannedGrants(params, signal),
    [params],
  )

  const onSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await syncPlannedGrants()
      if (res.success) {
        setSyncMsg({ ok: true, text: 'Plano Anual sincronizado com sucesso.' })
        setPage(1)
        reload()
      } else {
        setSyncMsg({ ok: false, text: res.error || 'A sincronização falhou.' })
      }
    } catch (err) {
      setSyncMsg({
        ok: false,
        text: err instanceof ApiError ? err.message : 'A sincronização falhou.',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Plano Anual de Avisos"
        title="Avisos planeados"
        description="Avisos previstos no Plano Anual, ordenados pela data de abertura prevista."
        actions={
          canSync ? (
            <Button onClick={onSync} loading={syncing}>
              Sincronizar Plano Anual
            </Button>
          ) : undefined
        }
      />

      {syncing && (
        <div className={styles.syncing}>
          <Spinner size={16} />
          A sincronizar o Plano Anual — pode demorar (descarrega e processa o documento).
        </div>
      )}
      {syncMsg && (
        <div className={styles.feedback}>
          <Alert
            variant={syncMsg.ok ? 'success' : 'danger'}
            onClose={() => setSyncMsg(null)}
          >
            {syncMsg.text}
          </Alert>
        </div>
      )}

      {loading && !data ? (
        <LoadingBlock message="A carregar avisos planeados…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.planned_grants.length > 0 ? (
        <div className={loading ? styles.stale : undefined}>
          <DataTable
            columns={columns}
            rows={data.planned_grants}
            rowKey={(p) => p.id}
            ariaLabel="Avisos planeados"
            sort={sort}
            onSortChange={(next) => {
              setSort(next)
              setPage(1)
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
          title="Sem avisos planeados"
          message={
            canSync
              ? 'Ainda não há avisos no Plano Anual. Sincronize para os obter.'
              : 'Ainda não há avisos no Plano Anual.'
          }
        />
      )}
    </div>
  )
}
