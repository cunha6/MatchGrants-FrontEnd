import type { UsersListParams } from './types'

export interface UsersFilterState {
  username: string
  email: string
  role: string
  active: 'true' | 'false' | 'all'
  entity_type: string
  entity_size: string
  nif: string
  main_cae: string
  region: string
}

export const DEFAULT_USERS_FILTERS: UsersFilterState = {
  username: '',
  email: '',
  role: '',
  active: 'all',
  entity_type: '',
  entity_size: '',
  nif: '',
  main_cae: '',
  region: '',
}

export function countActiveFilters(f: UsersFilterState): number {
  let n = 0
  if (f.username) n++
  if (f.email) n++
  if (f.role) n++
  if (f.active !== 'all') n++
  if (f.entity_type) n++
  if (f.entity_size) n++
  if (f.nif) n++
  if (f.main_cae) n++
  if (f.region) n++
  return n
}

export function toUsersParams(f: UsersFilterState): UsersListParams {
  return {
    username: f.username || undefined,
    email: f.email || undefined,
    role: f.role || undefined,
    active: f.active,
    entity_type: f.entity_type || undefined,
    entity_size: f.entity_size || undefined,
    nif: f.nif || undefined,
    main_cae: f.main_cae || undefined,
    region: f.region || undefined,
  }
}
