import type { EntitySize, EntityType, Role } from '../../shared/constants/domain'

/** Shape of a user as returned by the API (also reused by the auth feature). */
export interface User {
  id: number
  username: string
  first_name: string | null
  job_title: string | null
  email: string
  role: Role
  is_active: boolean
  is_staff: boolean
  date_joined: string | null
  entity_type: EntityType | null
  entity_size: EntitySize | null
  incorporation_date: string | null
  nif: string | null
  main_cae: string | null
  secondary_cae: string | null
  address: string | null
  region: string | null
  nuts_ii: string | null
  nuts_iii: string | null
}

export interface UsersListResponse {
  total: number
  page: number
  page_size: number
  num_pages: number
  users: User[]
}

export interface UsersListParams {
  page?: number
  page_size?: number
  role?: string
  active?: 'true' | 'false' | 'all'
  entity_type?: string
  entity_size?: string
  nif?: string
  main_cae?: string
  region?: string
  username?: string
  email?: string
}

/** Fields accepted when creating a user (client self-registration + admin). */
export interface UserCreatePayload {
  username: string
  email: string
  password: string
  entity_type?: string
  entity_size?: string
  nif?: string
  main_cae?: string
  secondary_cae?: string
  address?: string
  region?: string
  nuts_ii?: string
  nuts_iii?: string
  /** Only honoured for admins; ignored for anonymous self-registration. */
  role?: Role
}

export type UserUpdatePayload = Partial<Omit<UserCreatePayload, 'password'>>

export interface PasswordChangePayload {
  /** Required when a user changes their own password; omitted on admin reset. */
  current_password?: string
  password: string
}
