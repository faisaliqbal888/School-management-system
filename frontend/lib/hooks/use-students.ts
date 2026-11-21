"use client"

import { useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiQuery, type PaginationMeta } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/students.service.ts
// ─────────────────────────────────────────────────────────────

export type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "GRADUATED"
  | "TRANSFERRED"
  | "WITHDRAWN"
  | "PENDING"

export interface StudentListItem {
  id: string
  admissionNo: string
  rollNo: string | null
  name: string
  email: string
  phone: string | null
  className: string | null
  sectionName: string | null
  gender: "MALE" | "FEMALE" | "OTHER"
  status: StudentStatus
  avatarUrl: string | null
  parentName: string | null
  guardianPhone: string | null
}

export interface Guardian {
  id: string
  name: string
  relation: string
  phone: string
  email: string | null
  cnic: string | null
  occupation: string | null
  isPrimary: boolean
  isEmergency: boolean
}

export interface StudentDetail {
  id: string
  admissionNo: string
  rollNo: string | null
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  accountStatus: string
  gender: "MALE" | "FEMALE" | "OTHER"
  dateOfBirth: string
  bloodGroup: string | null
  address: string | null
  city: string | null
  admissionDate: string
  status: StudentStatus
  class: { id: string; name: string; level: number } | null
  section: { id: string; name: string } | null
  academicYear: string | null
  guardians: Guardian[]
  attendance: {
    sampleDays: number
    presentDays: number
    rate: number | null
    recent: { date: string; status: string }[]
  }
  results: {
    id: string
    exam: string
    type: string
    subject: string
    marks: number
    totalMarks: number
    grade: string | null
    date: string
  }[]
  averagePercent: number | null
  fees: {
    totalBilled: number
    totalPaid: number
    outstanding: number
    invoices: {
      id: string
      invoiceNo: string
      title: string
      amount: number
      paid: number
      dueDate: string
      status: string
    }[]
  }
}

export interface CreateStudentPayload {
  name: string
  email: string
  phone?: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" | "OTHER"
  bloodGroup?: string
  address?: string
  city?: string
  classId?: string
  sectionId?: string
  rollNo?: string
  guardian: {
    name: string
    relation: string
    phone: string
    email?: string
    cnic?: string
    occupation?: string
  }
}

/** PATCH body — every field optional, nullable fields accept `null` to clear. */
export type UpdateStudentPayload = {
  name?: string
  phone?: string | null
  dateOfBirth?: string
  gender?: "MALE" | "FEMALE" | "OTHER"
  bloodGroup?: string | null
  address?: string | null
  city?: string | null
  status?: StudentStatus
  classId?: string | null
  sectionId?: string | null
  rollNo?: string | null
  photoUrl?: string | null
  guardian?: {
    name?: string
    relation?: string
    phone?: string
    email?: string | null
    cnic?: string | null
    occupation?: string | null
  }
}

export interface StudentFilters {
  page?: number
  limit?: number
  search?: string
  classId?: string
  sectionId?: string
  status?: StudentStatus
  gender?: "MALE" | "FEMALE" | "OTHER"
  sortBy?: string
  sortOrder?: "asc" | "desc"
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

export function useStudents(filters: StudentFilters = {}) {
  const query = useMemo(() => toQueryString(filters as Record<string, unknown>), [filters])
  const key = query ? `/students?${query}` : "/students"

  const result = useApiQuery<StudentListItem[]>(key)

  return {
    students: result.data ?? [],
    meta: result.meta as PaginationMeta | null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useStudent(id: string | null) {
  const result = useApiQuery<StudentDetail>(id ? `/students/${id}` : null)
  return {
    student: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useCreateStudent() {
  return useCallback(
    (payload: CreateStudentPayload) =>
      apiFetch<{ student: StudentDetail; credentials: { email: string; temporaryPassword: string } }>(
        "/students",
        { method: "POST", body: payload },
      ),
    [],
  )
}

export function useUpdateStudent() {
  return useCallback(
    (id: string, payload: UpdateStudentPayload) =>
      apiFetch<StudentDetail>(`/students/${id}`, { method: "PATCH", body: payload }),
    [],
  )
}

export function useDeleteStudent() {
  return useCallback(
    (id: string, hard = false) =>
      apiFetch<{ deleted: boolean; status?: string }>(
        `/students/${id}${hard ? "?hard=true" : ""}`,
        { method: "DELETE" },
      ),
    [],
  )
}

/** Triggers a browser download of the CSV export for the current filters. */
export function exportStudentsCsv(filters: StudentFilters = {}): void {
  const query = toQueryString({ ...filters, page: 1, limit: 100 } as Record<string, unknown>)
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1"
  window.location.href = `${base}/students/export.csv${query ? `?${query}` : ""}`
}

export interface ImportRowError {
  row: number
  email: string
  message: string
}

export interface ImportReport {
  dryRun: boolean
  total: number
  imported: number
  skipped: number
  errors: ImportRowError[]
  sample?: { email: string; temporaryPassword: string }
}

/** Bulk CSV import. Always call with `dryRun: true` first so the user sees row errors. */
export function useImportStudents() {
  return useCallback(
    (payload: { csv: string; dryRun: boolean; defaultPassword?: string }) =>
      apiFetch<ImportReport>("/students/import", { method: "POST", body: payload }),
    [],
  )
}
