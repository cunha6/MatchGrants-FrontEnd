import { useEffect, useRef, useState } from 'react'
import { getNoticeAiDetail } from './api'
import type { NoticeAiContent, NoticeAiDetailState, NoticeAiStatus } from './types'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../../api/client'

/** UI-facing status. The API's 'pending' and 'error' both collapse to 'idle':
 *  a stale error isn't retried automatically (there's no dedicated retry
 *  endpoint), so both just show the same "Gerar detalhe IA" starting point. */
export type NoticeAiUiStatus = 'idle' | 'loading' | 'done' | 'error'

export interface NoticeAiDetailError {
  /** 404 = this anúncio has no caderno de encargos to read — an explanation,
   *  not a failure (also covers a poll timeout, which isn't a document issue
   *  either but shouldn't be worded as one). */
  missingDocument: boolean
  message: string
}

export interface NoticeAiDetailHookState {
  /** Whether to offer the trigger button. False for anyone but
   *  admin/commercial_public (client gets a 403 on POST — viewing already-
   *  generated content has no role restriction, only triggering does), and
   *  once there's nothing left to trigger (already done, or already running). */
  canTrigger: boolean
  /** 'loading' covers both an explicit generate() and resuming a poll that
   *  was already under way when the page loaded. */
  status: NoticeAiUiStatus
  detail: NoticeAiContent | null
  error: NoticeAiDetailError | null
  /** Label for the trigger button, which changes with the state. */
  buttonLabel: string
  /** Kicks off generation and polls (on 202) until it's done. */
  generate: () => void
}

/** How long to wait between polls, and how many to make before giving up —
 *  4s x 24 ≈ 96s, in the "~1-2 min" window the backend suggests. */
const POLL_INTERVAL_MS = 4000
const MAX_POLLS = 24

function initialUiStatus(apiStatus: NoticeAiStatus): NoticeAiUiStatus {
  if (apiStatus === 'done') return 'done'
  if (apiStatus === 'generating') return 'loading'
  return 'idle' // 'pending' or 'error'
}

/**
 * State for the AI reading of the caderno de encargos.
 *
 * `initial` seeds from Notice.ai_detail (the GET the page already loaded) —
 * when it's already 'done', this never has to call the endpoint at all; when
 * it's already 'generating' (someone else triggered it, or a previous reload
 * left it running), polling resumes automatically without the user clicking
 * anything. A fresh generate() only ever runs from an explicit trigger — the
 * underlying job is a paid AI call.
 *
 * `initial` is `null` while the page's own GET /anuncios/<id>/ is still
 * loading — the hook itself must run unconditionally on every render (rules
 * of hooks), so it seeds lazily, once, the first time `initial` arrives
 * instead of requiring it up front.
 *
 * Split from the panel so the trigger button can live elsewhere on the page
 * (the header row) while the result renders lower down.
 */
export function useNoticeAiDetail(
  noticeId: number,
  initial: NoticeAiDetailState | null,
): NoticeAiDetailHookState {
  const { hasRole } = useAuth()
  const [status, setStatus] = useState<NoticeAiUiStatus>('idle')
  const [detail, setDetail] = useState<NoticeAiContent | null>(null)
  const [error, setError] = useState<NoticeAiDetailError | null>(null)

  // Identifies the current generate()/poll chain. Bumped on unmount so a poll
  // that resolves afterwards knows to discard itself instead of calling
  // setState on an unmounted component.
  const requestIdRef = useRef(0)
  useEffect(() => {
    return () => {
      requestIdRef.current += 1
    }
  }, [])

  const poll = async (requestId: number, attempt: number) => {
    try {
      const res = await getNoticeAiDetail(noticeId)
      if (requestIdRef.current !== requestId) return // unmounted/superseded

      if (res.status === 'generating') {
        if (attempt >= MAX_POLLS) {
          setError({
            missingDocument: false,
            message:
              'A geração está a demorar mais do que o esperado. Tente novamente dentro de alguns minutos.',
          })
          setStatus('error')
          return
        }
        setTimeout(() => poll(requestId, attempt + 1), POLL_INTERVAL_MS)
        return
      }

      setDetail(res)
      setStatus('done')
    } catch (err) {
      if (requestIdRef.current !== requestId) return
      const notFound = err instanceof ApiError && err.status === 404
      setError({
        missingDocument: notFound,
        message: notFound
          ? 'Este anúncio não tem caderno de encargos disponível para análise.'
          : err instanceof ApiError
            ? err.message
            : 'Não foi possível gerar o detalhe.',
      })
      setStatus('error')
    }
  }

  // Seeds from Notice.ai_detail exactly once, the first time it's available
  // (it starts `null` while the page's own GET is still loading, then
  // settles once). This is the standard React pattern for deriving state
  // from a prop that arrives later: adjust state directly during render,
  // comparing against the last-seen value in state (not a ref — refs can't
  // be read during render) so it only fires on that one transition.
  const [seenInitial, setSeenInitial] = useState<NoticeAiDetailState | null>(null)
  if (initial && initial !== seenInitial) {
    setSeenInitial(initial)
    setStatus(initialUiStatus(initial.status))
    if (initial.status === 'done') setDetail(initial)
  }

  // Resuming a poll is a real side effect (a network call), so unlike the
  // state seed above, this does belong in an effect — guarded to fire only
  // once, right after that same seed. A ref is correct here (unlike above):
  // it's only ever touched inside the effect, never read during render.
  const pollStartedRef = useRef(false)
  useEffect(() => {
    if (pollStartedRef.current || initial?.status !== 'generating') return
    pollStartedRef.current = true
    poll(requestIdRef.current, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  const generate = () => {
    const requestId = ++requestIdRef.current
    setStatus('loading')
    setError(null)
    poll(requestId, 0)
  }

  const buttonLabel = status === 'error' ? 'Tentar novamente' : 'Gerar detalhe IA'

  return {
    canTrigger:
      hasRole('admin', 'commercial_public') &&
      // Already generated, or already running — nothing left to trigger.
      status !== 'done' &&
      // A 404 means there's no document to read — retrying can't change that.
      !error?.missingDocument,
    status,
    detail,
    error,
    buttonLabel,
    generate,
  }
}
