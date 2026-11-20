"use client"

import { useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiQuery, type PaginationMeta } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/attendance.service.ts
// ─────────────────────────────────────────────────────────────

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | "HOLIDAY"

export interface AttendanceSection {
  id: string
  name: string
  className: string
  level: number
  studentCount: number
}

export interface RosterEntry {
  studentId: string
  name: string
  admissionNo: string
  rollNo: string | null
  avatarUrl: string | null
  status: AttendanceStatus | null
  remarks: string | null
}

export interface SectionRoster {
  section: { id: string; name: string; className: string }
  date: string
  marked: boolean
  entries: RosterEntry[]
  summary: Record<AttendanceStatus | "UNMARKED" | "total", number>
}

export interface AttendanceHistoryRow {
  id: string
  date: string
  status: AttendanceStatus
  remarks: string | null
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  sectionName: string
}

export interface AttendanceSummaryData {
  scope: "self" | "section"
  studentId?: string
  sectionId?: string
  from: string
  to: string
  totalDays: number
  present: number
  absent: number
  late: number
  excused: number
  holiday: number
  rate: number | null
  monthly: { month: string; present: number; absent: number; late: number; rate: number | null }[]
}

export interface TodayOverview {
  date: string
  byStatus: { present: number; absent: number; late: number; excused: number }
  sections: {
    id: string
    name: string
    className: string
    students: number
    marked: number
    present: number
    rate: number | null
    complete: boolean
  }[]
  sectionsMarked: number
  sectionsTotal: number
}

export interface HistoryFilters {
  page?: number
  limit?: number
  search?: string
  studentId?: string
  sectionId?: string
  status?: AttendanceStatus
  from?: string
  to?: string
}

export interface MarkEntry {
  studentId: string
  status: AttendanceStatus
  remarks?: string | null
}

function toQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === "all") continue
    params.set(key, String(value))
  }
  return params.toString()
}

/** UTC "today" — the API stores dates at midnight UTC. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

// ─────────────────────────────────────────────────────────────
//  hooks
// ─────────────────────────────────────────────────────────────

export function useAttendanceSections(enabled = true) {
  const result = useApiQuery<AttendanceSection[]>("/attendance/sections", { enabled })
  return {
    sections: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error,
  }
}

export function useRoster(sectionId: string | null, date: string) {
  const key = sectionId ? `/attendance/roster/${sectionId}?date=${date}` : null
  const result = useApiQuery<SectionRoster>(key)

  return {
    roster: result.data,
    entries: result.data?.entries ?? [],
    summary: result.data?.summary,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useAttendanceHistory(filters: HistoryFilters = {}) {
  const query = useMemo(() => toQueryString(filters as Record<string, unknown>), [filters])
  const key = query ? `/attendance?${query}` : "/attendance"
  const result = useApiQuery<AttendanceHistoryRow[]>(key)

  return {
    rows: result.data ?? [],
    meta: result.meta as PaginationMeta | null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useAttendanceSummary(params: { studentId?: string; sectionId?: string; from?: string; to?: string } = {}) {
  const query = useMemo(() => toQueryString(params as Record<string, unknown>), [params])
  const key = `/attendance/summary${query ? `?${query}` : ""}`
  const result = useApiQuery<AttendanceSummaryData>(key)

  return {
    summary: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useTodayOverview(enabled = true) {
  const result = useApiQuery<TodayOverview>("/attendance/overview", { enabled })
  return {
    overview: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useMarkAttendance() {
  return useCallback(
    (payload: { sectionId: string; date: string; entries: MarkEntry[] }) =>
      apiFetch<{ sectionId: string; date: string; saved: number; summary: Record<string, number> }>(
        "/attendance/bulk",
        { method: "POST", body: payload },
      ),
    [],
  )
}
