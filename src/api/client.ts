/**
 * Central API client. EVERY request in the app goes through here — no component
 * or feature module calls fetch() directly.
 *
 * - Talks to the `/api` prefix, which the Vite dev proxy forwards to Django
 *   (see vite.config.ts). This keeps the browser same-origin so the session
 *   cookie is sent/stored automatically.
 * - Always sends `credentials: 'include'` (cookie session auth).
 * - The API is csrf_exempt, so no CSRF token is attached.
 * - Normalises errors into a single ApiError carrying status + the API's
 *   `error` message (+ `details` / `missing_fields` when present).
 */

/** Prefix stripped by the dev proxy → forwarded to http://localhost:8000. */
export const API_BASE = '/api'

/**
 * Build a browser-openable URL for a backend-relative path — e.g. an inline
 * file endpoint like "/avisos/1/document/". Prefixing with API_BASE routes it
 * through the same proxy the API uses (dev) / nginx (prod). Absolute URLs
 * (external documents) are returned unchanged.
 */
export function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

export interface MissingField {
  field: string
  label: string
}

export class ApiError extends Error {
  readonly status: number
  /** Field-level validation info from 400 responses. */
  readonly details?: unknown
  /** 422 match flow: the API is asking for more company data. */
  readonly needsMoreInfo: boolean
  readonly missingFields: MissingField[]
  /** The full parsed response body, when available. */
  readonly payload?: unknown

  constructor(
    status: number,
    message: string,
    payload?: Record<string, unknown>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
    this.details = payload?.details
    this.needsMoreInfo = Boolean(payload?.needs_more_info)
    this.missingFields = Array.isArray(payload?.missing_fields)
      ? (payload!.missing_fields as MissingField[])
      : []
  }
}

/** Registered by AuthProvider so a 401 anywhere clears the session globally. */
let unauthorizedHandler: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

/** Build a `?a=1&b=2` string, skipping null/undefined/empty values. */
export function buildQuery(params?: QueryParams): string {
  if (!params) return ''
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    usp.append(key, String(value))
  }
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

interface RequestOptions {
  method?: string
  body?: unknown
  signal?: AbortSignal
  query?: QueryParams
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, query } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  let payload: BodyInit | undefined
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: payload,
      credentials: 'include',
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(
      0,
      'Não foi possível contactar o servidor. Verifique a ligação e se a API está a correr.',
    )
  }

  // 204 / empty body
  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok) {
    if (response.status === 401 && unauthorizedHandler) unauthorizedHandler()
    const body = (data ?? {}) as Record<string, unknown>
    const message =
      (typeof body.error === 'string' && body.error) ||
      (typeof body.detail === 'string' && body.detail) ||
      defaultMessageFor(response.status)
    throw new ApiError(response.status, message, body)
  }

  return data as T
}

function defaultMessageFor(status: number): string {
  switch (status) {
    case 400:
      return 'Pedido inválido.'
    case 401:
      return 'Sessão não iniciada.'
    case 403:
      return 'Não tem permissão para esta ação.'
    case 404:
      return 'Recurso não encontrado.'
    case 422:
      return 'Faltam dados para completar o pedido.'
    case 429:
      return 'Demasiadas tentativas. Tente novamente mais tarde.'
    case 502:
      return 'Falha ao contactar um serviço externo.'
    case 500:
      return 'Erro interno do servidor.'
    default:
      return 'Ocorreu um erro inesperado.'
  }
}

export const api = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'PUT', body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'PATCH', body, signal }),
  del: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: 'DELETE', signal }),
}
