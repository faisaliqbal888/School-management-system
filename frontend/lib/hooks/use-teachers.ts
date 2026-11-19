"use client"

import { useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiQuery, type PaginationMeta } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/teachers.service.ts
// ─────────────────────────────────────────────────────────────

export type StaffStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED" | "TERMINATED"
export type EmploymentType = "PERMANENT" | "CONTRACT" | "VISITING" | "PART_TIME"

export interface TeacherListItem {
  id: string
  employeeNo: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  department: string
  designation: string
  qualification: string | null
  specialization: string | null
  employmentType: EmploymentType
  status: StaffStatus
  joiningDate: string
  baseSalary: number
  subjects: string[]
  classTeacherOf: string | null
  sectionCount: number
  studentCount: number
}

export interface TeacherDetail extends TeacherListItem {
  classes: { id: string; name: string; level: number; section: string | null }[]
  subjectAssignments: { id: string; subject: string; className: string; sectionName: string | null }[]
  timetableLoad: number
  payrollLatest: { period: string; net: number; status: string } | null
  leaveRequests: { id: string; from: string; to: string; status: string; reason: string }[]
}

export interface TeacherFilterOptions {
  departments: string[]
  designations: string[]
  subjects: { id: string; name: string; code: string | null }[]
}

export interface TeacherFilters {
  page?: number
  limit?: number
  search?: string
  department?: string
  status?: StaffStatus
  employmentType?: EmploymentType
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface CreateTeacherPayload {
  name: string
  email: string
  phone?: string | null
  department: string
  designation: string
  qualification?: string | null
  specialization?: string | null
  joiningDate: string
  employmentType?: EmploymentType
  baseSalary: number
  subjectIds?: string[]
  password?: string
}

export type UpdateTeacherPayload = Partial<Omit<CreateTeacherPayload, "email" | "password">> & {
  status?: StaffStatus
}

function toQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === "all") continue
    params.set(key, String(value))
  }
  return params.toString()
}

// ─────────────────────────────────────────────────────────────
//  hooks
// ─────────────────────────────────────────────────────────────

export function useTeachers(filters: TeacherFilters = {}) {
  const query = useMemo(() => toQueryString(filters as Record<string, unknown>), [filters])
  const key = query ? `/teachers?${query}` : "/teachers"
  const result = useApiQuery<TeacherListItem[]>(key)

  return {
    teachers: result.data ?? [],
    meta: result.meta as PaginationMeta | null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useTeacherOptions(enabled = true) {
  const result = useApiQuery<TeacherFilterOptions>("/teachers/filters", { enabled })
  return {
    options: result.data,
    isLoading: result.isLoading,
  }
}

export function useTeacher(id: string | null) {
  const result = useApiQuery<TeacherDetail>(id ? `/teachers/${id}` : null)
  return {
    teacher: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useCreateTeacher() {
  return useCallback(
    (payload: CreateTeacherPayload) =>
      apiFetch<{ teacher: TeacherDetail; credentials: { email: string; temporaryPassword: string } }>(
        "/teachers",
        { method: "POST", body: payload },
      ),
    [],
  )
}

export function useUpdateTeacher() {
  return useCallback(
    (id: string, payload: UpdateTeacherPayload) =>
      apiFetch<TeacherDetail>(`/teachers/${id}`, { method: "PATCH", body: payload }),
    [],
  )
}

export function useDeleteTeacher() {
  return useCallback(
    (id: string, hard = false) =>
      apiFetch<{ deleted: boolean; status?: string }>(
        `/teachers/${id}${hard ? "?hard=true" : ""}`,
        { method: "DELETE" },
      ),
    [],
  )
}

/** Browser download of the teachers CSV. */
export function exportTeachersCsv(filters: TeacherFilters = {}): void {
  const query = toQueryString({ ...filters, page: 1, limit: 100 } as Record<string, unknown>)
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"
  window.location.href = `${base}/teachers/export.csv${query ? `?${query}` : ""}`
}

/** Employee-ish "new staff" defaults — joining date = today. */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}
