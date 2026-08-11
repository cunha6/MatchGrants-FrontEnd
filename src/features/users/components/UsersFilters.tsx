import { FilterPanel, Input, Select } from '../../../shared/components'
import {
  ENTITY_SIZE_OPTIONS,
  ENTITY_TYPE_OPTIONS,
  ROLE_OPTIONS,
} from '../../../shared/constants/domain'
import {
  countActiveFilters,
  DEFAULT_USERS_FILTERS,
  type UsersFilterState,
} from '../filters'

interface Props {
  value: UsersFilterState
  onChange: (next: UsersFilterState) => void
}

export function UsersFilters({ value, onChange }: Props) {
  const set = (patch: Partial<UsersFilterState>) => onChange({ ...value, ...patch })

  return (
    <FilterPanel
      activeCount={countActiveFilters(value)}
      onClear={() => onChange(DEFAULT_USERS_FILTERS)}
    >
      <Input
        label="Nome Utilizador"
        value={value.username}
        onChange={(e) => set({ username: e.target.value })}
      />
      <Input
        label="Email"
        value={value.email}
        onChange={(e) => set({ email: e.target.value })}
      />
      <Select
        label="Papel"
        placeholder="Todos"
        options={ROLE_OPTIONS}
        value={value.role}
        onChange={(e) => set({ role: e.target.value })}
      />
      <Select
        label="Estado"
        value={value.active}
        onChange={(e) => set({ active: e.target.value as UsersFilterState['active'] })}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'true', label: 'Ativos' },
          { value: 'false', label: 'Inativos' },
        ]}
      />
      <Select
        label="Tipo de entidade"
        placeholder="Todos"
        options={ENTITY_TYPE_OPTIONS}
        value={value.entity_type}
        onChange={(e) => set({ entity_type: e.target.value })}
      />
      <Select
        label="Dimensão"
        placeholder="Todas"
        options={ENTITY_SIZE_OPTIONS}
        value={value.entity_size}
        onChange={(e) => set({ entity_size: e.target.value })}
      />
      <Input
        label="NIF"
        value={value.nif}
        onChange={(e) => set({ nif: e.target.value })}
      />
      <Input
        label="CAE principal"
        value={value.main_cae}
        onChange={(e) => set({ main_cae: e.target.value })}
      />
      <Input
        label="Região"
        value={value.region}
        onChange={(e) => set({ region: e.target.value })}
      />
    </FilterPanel>
  )
}
