import { api } from '../../api/client'
import type { User } from '../users/types'

export interface LoginPayload {
  username: string
  password: string
}

/** POST /users/login/ — sets the session cookie and returns the user. */
export function login(payload: LoginPayload): Promise<User> {
  return api.post<User>('/users/login/', payload)
}

/** POST /users/logout/ — clears the session. */
export function logout(): Promise<unknown> {
  return api.post('/users/logout/')
}

/** GET /users/me/ — used at startup to restore a session from the cookie. */
export function fetchMe(signal?: AbortSignal): Promise<User> {
  return api.get<User>('/users/me/', undefined, signal)
}
