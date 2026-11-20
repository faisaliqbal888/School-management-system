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
/**
 * Shared downloader for both report formats.
 *
 * Both endpoints stream the file with a `Content-Disposition` filename and the
 * same query, so only the path and the fallback extension differ.
 */
async function downloadReport(
  type: ReportType,
  format: "csv" | "pdf",
  days: number,
): Promise<string> {
  const params = new URLSearchParams({ type })
  if (type === "attendance") params.set("days", String(days))
  const path = format === "pdf" ? "/reports/export.pdf" : "/reports/export"

  const response = await fetch(`${API_BASE}${path}?${params.toString()}`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`Export failed (${response.status})`)
  }

  const blob = await response.blob()
  const disposition = response.headers.get("Content-Disposition") ?? ""
  const match = disposition.match(/filename="([^"]+)"/)
  const filename = match?.[1] ?? `${type}-report.${format}`

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

export const downloadReportCsv = (type: ReportType, days = 30) => downloadReport(type, "csv", days)

/** Renders the same rows server-side into a print-ready A4 PDF. */
export const downloadReportPdf = (type: ReportType, days = 30) => downloadReport(type, "pdf", days)
