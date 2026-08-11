import { api, type QueryParams } from '../../api/client'
import type {
  User,
  UserCreatePayload,
  UsersListParams,
  UsersListResponse,
  UserUpdatePayload,
} from './types'

/** GET /users/ — paginated list (admin / commercial_grants / commercial_public). */
export function listUsers(
  params: UsersListParams,
  signal?: AbortSignal,
): Promise<UsersListResponse> {
  return api.get<UsersListResponse>('/users/', params as QueryParams, signal)
}

/** GET /users/<id>/ — admin, self, or commercial_grants/commercial_public
 *  when the target is a viewer/client. */
export function getUser(id: number, signal?: AbortSignal): Promise<User> {
  return api.get<User>(`/users/${id}/`, undefined, signal)
}

/** POST /users/create/ — anonymous self-registration or admin create. */
export function createUser(payload: UserCreatePayload): Promise<User> {
  return api.post<User>('/users/create/', payload)
}

/** PUT /users/<id>/update/ — admin, self, or commercial_grants/commercial_public
 *  when the target is a viewer/client. */
export function updateUser(
  id: number,
  payload: UserUpdatePayload,
): Promise<User> {
  return api.put<User>(`/users/${id}/update/`, payload)
}

/** POST /users/<id>/password/ — admin, self, or commercial_grants/commercial_public
 *  when the target is a viewer/client. Takes no body — sends an email with a
 *  reset link to the account's registered email. 400 if the account has no
 *  email or is inactive. */
export function sendPasswordResetEmail(id: number): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/users/${id}/password/`)
}

/** POST /users/<id>/activate/ — re-activates a soft-deleted user. Admin, or
 *  commercial_grants/commercial_public when the target is a viewer/client. */
export function activateUser(id: number): Promise<unknown> {
  return api.post(`/users/${id}/activate/`)
}

/** DELETE /users/<id>/ — admin soft-delete. */
export function deleteUser(id: number): Promise<unknown> {
  return api.del(`/users/${id}/`)
}
