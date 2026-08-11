import type { EntitySize, EntityType, Role } from '../../shared/constants/domain'

/**
 * Shape of a user as returned by the API (also reused by the auth feature).
 * For admin/commercial_grants/commercial_public, the API omits the
 * entity/location fields (and job_title) entirely rather than sending null —
 * they're only ever present for client/viewer accounts. Read them with `?.`/`??`.
 */
/** One entry of `User.matched_grants` — the result of the client's most
 *  recent /match/evaluate-nif/ call. Enough to link straight to the aviso
 *  (GET /avisos/<id>/) without an extra lookup. */
export interface MatchedGrant {
  id: number
  grant_code: string | null
  title: string | null
}

export interface User {
  id: number
  username: string
  first_name: string | null
  email: string
  role: Role
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string | null
  job_title?: string | null
  entity_type?: EntityType | null
  entity_size?: EntitySize | null
  incorporation_date?: string | null
  nif?: string | null
  main_cae?: string | null
  secondary_cae?: string[] | null
  address?: string | null
  postal_code?: string | null
  /** Derived server-side from postal_code. */
  city?: string | null
  county?: string | null
  region?: string | null
  /** The client's latest match result — replaced (not accumulated) on every
   *  new /match/evaluate-nif/ call. */
  matched_grants?: MatchedGrant[]
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

/** Fields accepted when creating a user (client self-registration + admin).
 *  Nobody sets a password here — the account is created without one and an
 *  email is sent with a link to set it (see /reset-password). */
export interface UserCreatePayload {
  username: string
  first_name?: string
  email: string
  entity_type?: string
  entity_size?: string
  nif?: string
  main_cae?: string
  secondary_cae?: string[]
  address?: string
  postal_code?: string
  incorporation_date?: string
  /** city/county/region are normally derived server-side from postal_code;
   *  sending them is only a manual override, not the regular flow. */
  city?: string
  county?: string
  region?: string
  /** Only honoured for admins; ignored for anonymous self-registration. */
  role?: Role
}

export type UserUpdatePayload = Partial<UserCreatePayload>
