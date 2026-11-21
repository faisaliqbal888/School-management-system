import { useCallback, useEffect, useMemo, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiQuery, type PaginationMeta } from "./use-api-query"

/** Administration: user directory, credential resets and school settings. */

export interface DirectoryUser {
  id: string
  name: string
  email: string
  phone: string | null
  role: "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED"
  lastLoginAt: string | null
  createdAt: string
  admissionNo: string | null
  employeeNo: string | null
  className: string | null
  department: string | null
}

export interface DirectoryStats {
  total: number
  active: number
  inactive: number
  byRole: Partial<Record<DirectoryUser["role"], number>>
}

export interface UserQuery {
  page?: number
  limit?: number
  role?: string
  status?: string
  search?: string
}

function buildQuery(params: Record<string, unknown>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

/**
 * `useApiQuery` only surfaces `data` and `meta`; the directory also returns a
 * `stats` block at the top level, so this hook requests the raw payload once
 * and mirrors the same fetch lifecycle.
 */
function useUsersQuery(key: string) {
  const [stats, setStats] = useState<DirectoryStats | null>(null)
  const [payload, setPayload] = useState<DirectoryUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"}${key}`, {
          credentials: "include",
          signal: controller.signal,
        })
        const body = await res.json().catch(() => null)
        if (controller.signal.aborted) return

        if (!res.ok || !body || body.success === false) {
          setError(body?.error?.message ?? `Request failed (${res.status})`)
          setPayload([])
          return
        }
        setPayload(body.data as DirectoryUser[])
        setMeta((body.meta as PaginationMeta | undefined) ?? null)
        setStats((body.stats as DirectoryStats | undefined) ?? null)
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : "Network error")
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })()

    return () => controller.abort()
  }, [key, tick])

  return { users: payload, meta, stats, isLoading, error, refetch }
}

export function useUsers(filters: UserQuery) {
  return useUsersQuery(`/admin/users${buildQuery(filters as Record<string, unknown>)}`)
}

export interface SystemAlert {
  id: string
  title: string
  message: string
  severity: "critical" | "warning" | "info"
  count: number
  href: string
}

export interface AlertsPayload {
  alerts: SystemAlert[]
  summary: { critical: number; warning: number; info: number }
  generatedAt: string
}

export function useAlerts() {
  const query = useApiQuery<AlertsPayload>("/admin/alerts")
  return {
    alerts: query.data?.alerts ?? [],
    summary: query.data?.summary ?? { critical: 0, warning: 0, info: 0 },
    generatedAt: query.data?.generatedAt ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export interface StaffRow {
  id: string
  /** Distinguishes a teachers-row id from an office-staff id (both are cuids). */
  type: "teacher" | "staff"
  employeeNo: string
  name: string
  position: string
  department: string
  email: string | null
  phone: string | null
  employmentType: string
  baseSalary: number
  status: string
  joiningDate: string
}

/** Admin-office staff only — teachers come from `useTeachers`. */
export function useStaffDirectory() {
  const query = useApiQuery<StaffRow[]>("/admin/staff")
  return { staff: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useSettings() {
  const query = useApiQuery<{ key: string; value: string; source: "database" | "default"; updatedAt: string | null }[]>(
    "/admin/settings",
  )
  return {
    settings: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

/** Mutations for the directory — each returns a plain async function. */
export function useUserMutations() {
  const [pending, setPending] = useState(false)

  const run = useCallback(async <T,>(path: string, init: { method: "POST" | "PATCH"; body?: unknown }) => {
    setPending(true)
    try {
      return await apiFetch<T>(path, init)
    } finally {
      setPending(false)
    }
  }, [])

  const createUser = useCallback(
    (body: { name: string; email: string; password: string; role: string; phone?: string }) =>
      run<DirectoryUser>("/admin/users", { method: "POST", body }),
    [run],
  )

  const setStatus = useCallback(
    (id: string, status: string) =>
      run<DirectoryUser>(`/admin/users/${id}/status`, { method: "PATCH", body: { status } }),
    [run],
  )

  const resetPassword = useCallback(
    (id: string) => run<{ name: string; password: string }>(`/admin/users/${id}/reset-password`, { method: "POST" }),
    [run],
  )

  const saveSettings = useCallback(
    (updates: { key: string; value: string }[]) =>
      run<{ key: string; value: string }[]>("/admin/settings", { method: "PATCH", body: { updates } }),
    [run],
  )

  return useMemo(
    () => ({ pending, createUser, setStatus, resetPassword, saveSettings }),
    [pending, createUser, setStatus, resetPassword, saveSettings],
  )
}
