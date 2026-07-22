import { api, type QueryParams } from '../../api/client'
import type {
  PasswordChangePayload,
  User,
  UserCreatePayload,
  UsersListParams,
  UsersListResponse,
  UserUpdatePayload,
} from './types'

/** GET /users/ — paginated list (admin / commercial). */
export function listUsers(
  params: UsersListParams,
  signal?: AbortSignal,
): Promise<UsersListResponse> {
  return api.get<UsersListResponse>('/users/', params as QueryParams, signal)
}

/** GET /users/<id>/ */
export function getUser(id: number, signal?: AbortSignal): Promise<User> {
  return api.get<User>(`/users/${id}/`, undefined, signal)
}

/** POST /users/create/ — anonymous self-registration or admin create. */
export function createUser(payload: UserCreatePayload): Promise<User> {
  return api.post<User>('/users/create/', payload)
}

/** PUT /users/<id>/update/ */
export function updateUser(
  id: number,
  payload: UserUpdatePayload,
): Promise<User> {
  return api.put<User>(`/users/${id}/update/`, payload)
}

/** POST /users/<id>/password/ */
export function changePassword(
  id: number,
  payload: PasswordChangePayload,
): Promise<unknown> {
  return api.post(`/users/${id}/password/`, payload)
}

/** POST /users/<id>/activate/ — admin re-activates a soft-deleted user. */
export function activateUser(id: number): Promise<unknown> {
  return api.post(`/users/${id}/activate/`)
}

/** DELETE /users/<id>/ — admin soft-delete. */
export function deleteUser(id: number): Promise<unknown> {
  return api.del(`/users/${id}/`)
}
