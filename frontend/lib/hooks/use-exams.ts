"use client"

import { useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiQuery, type PaginationMeta } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/exams.service.ts
// ─────────────────────────────────────────────────────────────

export type ExamType = "QUIZ" | "UNIT_TEST" | "MIDTERM" | "FINAL" | "PRACTICAL" | "PROJECT"
export type ExamStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "PUBLISHED"

export interface ExamRow {
  id: string
  name: string
  type: ExamType
  status: ExamStatus
  examDate: string
  startTime: string | null
  durationMin: number
  totalMarks: number
  passingMarks: number
  classId: string
  className: string
  sectionId: string | null
  sectionName: string | null
  subjectId: string
  subjectName: string
  resultCount: number
  averagePercent: number | null
  canEnterMarks: boolean
  canPublish: boolean
}

export interface MarksEntry {
  studentId: string
  name: string
  admissionNo: string
  rollNo: string | null
  marksObtained: number | null
  grade: string | null
  remarks: string | null
  resultId: string | null
}

export interface MarksRoster {
  exam: {
    id: string
    name: string
    subjectName: string
    className: string
    sectionName: string | null
    totalMarks: number
    passingMarks: number
    status: ExamStatus
    examDate: string
  }
  entries: MarksEntry[]
  stats: { entered: number; absent: number; total: number; average: number | null }
  canEdit: boolean
}

export interface ExamAnalysis {
  exam: {
    id: string
    name: string
    className: string
    subjectName: string
    totalMarks: number
    passingMarks: number
  }
  count: number
  average: number | null
  highest: number | null
  lowest: number | null
  passCount: number
  failCount: number
  passRate: number | null
  bands: Record<string, number>
  toppers: { name: string; admissionNo: string; marks: number; percent: number; grade: string | null; passed: boolean }[]
}

export interface ResultRow {
  id: string
  examId: string
  examName: string
  examType: string
  examDate: string
  subjectName: string
  studentId: string
  studentName: string
  admissionNo: string
  marksObtained: number
  totalMarks: number
  percent: number
  grade: string | null
  passed: boolean
  remarks: string | null
}

export interface TranscriptSubject {
  subject: string
  marks: number
  total: number
  percent: number
  grade: string | null
  passed: boolean
}

export interface TranscriptExam {
  examId: string
  examName: string
  examType: string
  examDate: string
  totalMarks: number
  subjects: TranscriptSubject[]
  obtained: number
  total: number
  percent: number
  grade: string
  passed: boolean
}

export interface Transcript {
  student: {
    id: string
    name: string
    admissionNo: string
    rollNo: string | null
    className: string
    sectionName: string | null
  }
  exams: TranscriptExam[]
  overall: { obtained: number; total: number; percent: number } | null
}

export interface ExamFilters {
  page?: number
  limit?: number
  search?: string
  classId?: string
  sectionId?: string
  subjectId?: string
  status?: ExamStatus
  type?: ExamType
  from?: string
  to?: string
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

export function useExams(filters: ExamFilters = {}) {
  const query = useMemo(() => toQueryString(filters as Record<string, unknown>), [filters])
  const result = useApiQuery<ExamRow[]>(`/exams${query ? `?${query}` : ""}`)
  return {
    exams: result.data ?? [],
    meta: result.meta as PaginationMeta | null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useMarksRoster(examId: string | null) {
  const result = useApiQuery<MarksRoster>(examId ? `/exams/${examId}/marks` : null)
  return {
    roster: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useExamAnalysis(examId: string | null) {
  const result = useApiQuery<ExamAnalysis>(examId ? `/exams/${examId}/analysis` : null)
  return {
    analysis: result.data,
    isLoading: result.isLoading,
    error: result.error,
  }
}

export function useResults(
  filters: { page?: number; limit?: number; search?: string; examId?: string; subjectId?: string; studentId?: string } = {},
) {
  const query = useMemo(() => toQueryString(filters as Record<string, unknown>), [filters])
  const result = useApiQuery<ResultRow[]>(`/results${query ? `?${query}` : ""}`)
  return {
    results: result.data ?? [],
    meta: result.meta as PaginationMeta | null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useTranscript(studentId?: string | null) {
  const key = `/results/transcript${studentId ? `?studentId=${studentId}` : ""}`
  const result = useApiQuery<Transcript>(key)
  return {
    transcript: result.data ?? undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useCreateExam() {
  return useCallback(
    (payload: {
      name: string
      type: ExamType
      examDate: string
      startTime?: string | null
      durationMin?: number
      totalMarks?: number
      passingMarks?: number
      classId: string
      sectionId?: string | null
      subjectId: string
    }) => apiFetch<{ id: string; name: string; examDate: string }>("/exams", { method: "POST", body: payload }),
    [],
  )
}

export function useUpdateExamStatus() {
  return useCallback(
    (id: string, status: ExamStatus) =>
      apiFetch<{ id: string; status: ExamStatus }>(`/exams/${id}/status`, {
        method: "PATCH",
        body: { status },
      }),
    [],
  )
}

export function useDeleteExam() {
  return useCallback(
    (id: string) => apiFetch<{ deleted: boolean }>(`/exams/${id}`, { method: "DELETE" }),
    [],
  )
}

export function useSaveMarks() {
  return useCallback(
    (examId: string, entries: { studentId: string; marksObtained: number | null; remarks?: string | null }[]) =>
      apiFetch<{ saved: number; removed: number; stats: MarksRoster["stats"] }>(`/exams/${examId}/marks`, {
        method: "POST",
        body: { entries },
      }),
    [],
  )
}

// ─────────────────────────────────────────────────────────────
//  helpers
// ─────────────────────────────────────────────────────────────

export const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  QUIZ: "Quiz",
  UNIT_TEST: "Unit Test",
  MIDTERM: "Midterm",
  FINAL: "Final",
  PRACTICAL: "Practical",
  PROJECT: "Project",
}

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  SCHEDULED: "Scheduled",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
  PUBLISHED: "Published",
}

/** Mirrors the backend grading scale. */
export function gradeFor(percent: number): string {
  if (percent >= 90) return "A+"
  if (percent >= 80) return "A"
  if (percent >= 70) return "B"
  if (percent >= 60) return "C"
  if (percent >= 50) return "D"
  if (percent >= 40) return "E"
  return "F"
}
