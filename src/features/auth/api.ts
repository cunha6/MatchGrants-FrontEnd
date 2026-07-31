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

/** POST /users/password-reset/ — public. Always 200 with a generic message,
 *  whether or not the email matches an account (avoids leaking which emails
 *  are registered). */
export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return api.post<{ message: string }>('/users/password-reset/', { email })
}

export interface PasswordResetConfirmPayload {
  uid: string
  token: string
  password: string
}

/** POST /users/password-reset/confirm/ — public. 400 if the link is
 *  invalid/expired or the password fails the policy (>8 chars). */
export function confirmPasswordReset(
  payload: PasswordResetConfirmPayload,
): Promise<unknown> {
  return api.post('/users/password-reset/confirm/', payload)
}
