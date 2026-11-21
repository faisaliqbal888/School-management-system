/**
 * Thin API client for the Express backend.
 *
 * Browser calls go to the same origin (`/api/v1/*`) and Next.js rewrites them
 * to the backend (see next.config.mjs), so there is no CORS in the browser and
 * httpOnly auth cookies are sent automatically.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? "/api/v1"

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, error: ApiError) {
    super(error.message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = error.code
    this.details = error.details
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  body?: unknown
  /** Skip the automatic refresh-and-retry on 401 (used by the refresh call itself). */
  skipRefresh?: boolean
  signal?: AbortSignal
}

let refreshPromise: Promise<boolean> | null = null
let csrfPromise: Promise<string | null> | null = null

/**
 * CSRF (double-submit) support.
 *
 * The backend sets a readable `csrf_token` cookie and refuses state-changing
 * requests that do not echo it back in the `X-CSRF-Token` header. A cross-site
 * attacker can cause the browser to send cookies but cannot read them, so it
 * cannot produce the header.
 */
function readCsrfCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

export async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCsrfCookie()
  if (existing) return existing

  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE}/csrf`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { data?: { csrfToken?: string } } | null) => payload?.data?.csrfToken ?? readCsrfCookie())
      .catch(() => null)
      .finally(() => {
        csrfPromise = null
      })
  }
  return csrfPromise
}

/** Attempts one silent refresh. Concurrent callers share the same request. */
async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, skipRefresh = false, signal } = options

  const mutating = method !== "GET"

  const doRequest = async () => {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers["Content-Type"] = "application/json"
    if (mutating) {
      const token = await ensureCsrfToken()
      if (token) headers["X-CSRF-Token"] = token
    }
    return fetch(`${API_BASE}${path}`, {
      method,
      credentials: "include",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  }

  let res = await doRequest()

  // Access token expired → refresh once, then retry.
  if (res.status === 401 && !skipRefresh) {
    const refreshed = await refreshSession()
    if (refreshed) res = await doRequest()
  }

  if (res.status === 204) return undefined as T

  const payload = (await res.json().catch(() => null)) as
    | { success: true; data: T }
    | { success: false; error: ApiError }
    | null

  if (!res.ok || !payload || payload.success === false) {
    const error: ApiError =
      payload && payload.success === false
        ? payload.error
        : { code: "NETWORK_ERROR", message: `Request failed (${res.status})` }
    throw new ApiRequestError(res.status, error)
  }

  return payload.data
}

// ─────────────────────────────────────────────────────────────
//  typed helpers
// ─────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiFetch<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
}
