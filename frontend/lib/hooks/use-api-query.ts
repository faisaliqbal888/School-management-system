"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { apiFetch, ApiRequestError } from "@/lib/api-client"

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface UseApiQueryOptions {
  /** Seconds between background refetches. Disabled by default. */
  refetchInterval?: number
  /** Skip the request (e.g. an id is not ready yet). */
  enabled?: boolean
}

export interface UseApiQueryResult<T> {
  data: T | null
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Minimal data hook: fetches on mount and whenever the key changes.
 *
 *   const { data, meta, isLoading, refetch } = useApiQuery<Student[]>(`/students?${qs}`)
 *
 * `key` must be a stable string — it is the cache/dedupe identity.
 */
export function useApiQuery<T>(
  key: string | null,
  options: UseApiQueryOptions = {},
): UseApiQueryResult<T> {
  const { refetchInterval, enabled = true } = options

  const [data, setData] = useState<T | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!enabled || key === null) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    void (async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"}${key}`, {
          credentials: "include",
          signal: controller.signal,
        })
        const payload = await res.json().catch(() => null)

        if (!mounted.current) return

        if (!res.ok || !payload || payload.success === false) {
          setError(payload?.error?.message ?? `Request failed (${res.status})`)
          setData(null)
          setMeta(null)
          return
        }

        setData(payload.data as T)
        setMeta((payload.meta as PaginationMeta | undefined) ?? null)
      } catch (err) {
        if (controller.signal.aborted) return
        if (!mounted.current) return
        setError(err instanceof Error ? err.message : "Network error")
      } finally {
        if (mounted.current) setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [key, enabled, tick])

  // optional polling
  useEffect(() => {
    if (!refetchInterval || !enabled) return
    const id = setInterval(() => setTick((t) => t + 1), refetchInterval * 1000)
    return () => clearInterval(id)
  }, [refetchInterval, enabled])

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  return { data, meta, isLoading, error, refetch }
}

// ─────────────────────────────────────────────────────────────
//  mutations
// ─────────────────────────────────────────────────────────────

export interface UseMutationResult<TVariables, TData> {
  mutate: (variables: TVariables) => Promise<TData>
  isPending: boolean
  error: string | null
  reset: () => void
}

/**
 * Thin mutation wrapper around `apiFetch` with pending/error state.
 *
 *   const create = useApiMutation<Student>((body) => apiFetch("/students", { method: "POST", body }))
 */
export function useApiMutation<TData, TVariables = void>(
  fn: (variables: TVariables) => Promise<TData>,
): UseMutationResult<TVariables, TData> {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsPending(true)
      setError(null)
      try {
        return await fn(variables)
      } catch (err) {
        const message =
          err instanceof ApiRequestError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Something went wrong"
        setError(message)
        throw err
      } finally {
        setIsPending(false)
      }
    },
    [fn],
  )

  const reset = useCallback(() => setError(null), [])

  return { mutate, isPending, error, reset }
}
