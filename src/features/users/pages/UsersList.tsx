import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listUsers } from '../api'
import type { User } from '../types'
import { UsersFilters } from '../components/UsersFilters'
import { DEFAULT_USERS_FILTERS, toUsersParams } from '../filters'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import {
  ActiveBadge,
  Badge,
  ButtonLink,
  type Column,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingBlock,
  PageHeader,
  Pagination,
} from '../../../shared/components'
import {
  ENTITY_TYPE_LABELS,
  ROLE_LABELS,
  labelFor,
} from '../../../shared/constants/domain'
import { orDash } from '../../../shared/utils/format'
import listStyles from '../../../shared/styles/list.module.css'

const PAGE_SIZE = 20

const columns: Column<User>[] = [
  {
    key: 'first_name',
    header: 'Nome',
    primary: true,
    render: (u) => <strong>{orDash(u.first_name)}</strong>,
  },
  { key: 'email', header: 'Email', render: (u) => orDash(u.email) },
  {
    key: 'role',
    header: 'Papel',
    render: (u) => <Badge variant="primary">{ROLE_LABELS[u.role] ?? u.role}</Badge>,
  },
  {
    key: 'entity_type',
    header: 'Tipo',
    render: (u) => labelFor(ENTITY_TYPE_LABELS, u.entity_type),
  },
  { key: 'nif', header: 'NIF', render: (u) => orDash(u.nif) },
  {
    key: 'active',
    header: 'Estado',
    render: (u) => <ActiveBadge active={u.is_active} />,
  },
]

export function UsersList() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState(DEFAULT_USERS_FILTERS)
  const [page, setPage] = useState(1)
  const debounced = useDebouncedValue(filters, 400)

  const params = useMemo(
    () => ({ ...toUsersParams(debounced), page, page_size: PAGE_SIZE }),
    [debounced, page],
  )

  const { data, loading, error, reload } = useApiQuery(
    (signal) => listUsers(params, signal),
    [params],
  )

  return (
    <div>
      <PageHeader
        eyebrow="Administração"
        title="Utilizadores"
        description="Gestão de contas e papéis."
        actions={<ButtonLink to="/users/new">Novo utilizador</ButtonLink>}
      />

      <UsersFilters
        value={filters}
        onChange={(next) => {
          setFilters(next)
          setPage(1)
        }}
      />

      {loading && !data ? (
        <LoadingBlock message="A carregar utilizadores…" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.users.length > 0 ? (
        <div className={loading ? listStyles.stale : undefined}>
          <DataTable
            columns={columns}
            rows={data.users}
            rowKey={(u) => u.id}
            onRowClick={(u) => navigate(`/users/${u.id}`)}
            ariaLabel="Lista de utilizadores"
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
          title="Sem utilizadores"
          message="Nenhum utilizador corresponde aos filtros."
        />
      )}
    </div>
  )
}
