import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/client'

export interface ApiQueryState<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  /** Re-run the fetcher manually (e.g. after a mutation). */
  reload: () => void
}

/**
 * Runs an async fetcher on mount and whenever `deps` change, exposing the
 * loading / error / data triplet every screen relies on. Stale responses from
 * superseded requests are ignored so fast filter changes don't flicker.
 *
 * The fetcher is intentionally NOT part of the dependency list — pass the real
 * inputs via `deps` (same contract as useEffect). Toggling loading/error at the
 * start of the fetch effect is the intended behaviour of a data-loading hook,
 * so `set-state-in-effect` is disabled for that effect only.
 */
export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList = [],
): ApiQueryState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [nonce, setNonce] = useState(0)

  // Keep the latest fetcher in a ref (updated after render) so it never has to
  // be a dependency of the fetch effect.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    /* eslint-disable react-hooks/set-state-in-effect */
    setLoading(true)
    setError(null)
    /* eslint-enable react-hooks/set-state-in-effect */

    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (!active || controller.signal.aborted) return
        setError(
          err instanceof ApiError
            ? err
            : new ApiError(0, 'Erro inesperado ao carregar os dados.'),
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps])

  return { data, loading, error, reload }
}
