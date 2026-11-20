"use client"

import { API_BASE } from "@/lib/api-client"
import { useApiQuery } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/reports.service.ts
// ─────────────────────────────────────────────────────────────

export interface FeeReportRow {
  classId: string
  className: string
  students: number
  invoices: number
  billed: number
  paid: number
  outstanding: number
  collectionRate: number | null
  overdue: number
}

export interface AttendanceReportRow {
  classId: string
  className: string
  sectionId: string
  sectionName: string
  students: number
  marked: number
  present: number
  absent: number
  late: number
  rate: number | null
}

export interface PerformanceReportRow {
  classId: string
  className: string
  subjectId: string
  subjectName: string
  examTitle: string
  examDate: string
  totalMarks: number
  passingMarks: number
  results: number
  average: number | null
  highest: number | null
  lowest: number | null
  passRate: number | null
}

export interface EnrolmentReportRow {
  classId: string
  className: string
  level: number
  sections: number
  capacity: number
  students: number
  utilisation: number | null
  genderSplit: { male: number; female: number; other: number }
  statusSplit: Record<string, number>
}

export type ReportType = "fees" | "attendance" | "performance" | "enrolment"

export function useFeeReport() {
  const query = useApiQuery<FeeReportRow[]>("/reports/fees")
  return { rows: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useAttendanceReport(days = 30) {
  const query = useApiQuery<AttendanceReportRow[]>(`/reports/attendance?days=${days}`)
  return { rows: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function usePerformanceReport() {
  const query = useApiQuery<PerformanceReportRow[]>("/reports/performance")
  return { rows: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useEnrolmentReport() {
  const query = useApiQuery<EnrolmentReportRow[]>("/reports/enrolment")
  return { rows: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

/** Totals used across cards — money already converted to numbers server-side. */
export function feeTotals(rows: FeeReportRow[]) {
  const billed = rows.reduce((sum, row) => sum + row.billed, 0)
  const paid = rows.reduce((sum, row) => sum + row.paid, 0)
  return {
    billed,
    paid,
    outstanding: Math.round((billed - paid) * 100) / 100,
    collectionRate: billed === 0 ? null : Math.round((paid / billed) * 1000) / 10,
    overdue: rows.reduce((sum, row) => sum + row.overdue, 0),
  }
}

/**
 * Downloads a report CSV through the authenticated API and saves it.
 * `apiFetch` attaches the session cookie; the blob is handed to the browser.
 */
export async function downloadReportCsv(type: ReportType, days = 30) {
  const query = type === "attendance" ? `?type=${type}&days=${days}` : `?type=${type}`

  const response = await fetch(`${API_BASE}/reports/export${query}`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`Export failed (${response.status})`)
  }

  const blob = await response.blob()
  const disposition = response.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? `${type}-report.csv`

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return filename
}
