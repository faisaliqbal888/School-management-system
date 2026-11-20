"use client"

import { useApiQuery } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/dashboard.service.ts
// ─────────────────────────────────────────────────────────────

export interface TrendDay {
  date: string
  present: number
  absent: number
  late: number
  total: number
  rate: number | null
}

export interface Trend {
  series: TrendDay[]
  overall: { present: number; absent: number; late: number; total: number; rate: number | null }
}

export interface TodayAttendance {
  marked: number
  present: number
  absent: number
  late: number
  rate: number | null
}

export interface TodayLesson {
  id: string
  startTime: string
  endTime: string
  roomNo: string | null
  subject: string
  teacher: string | null
  className: string
  isCurrent: boolean
}

export interface TodaySchedule {
  day: string
  lessons: TodayLesson[]
}

export interface FeePosition {
  billed: number
  paid: number
  outstanding: number
  collectionRate: number | null
  collectedThisMonth: number
  invoiceCount: number
  overdue: number
  pending: number
  currency: "PKR"
}

export interface ExamRowLite {
  id: string
  title: string
  type: string
  status: string
  date: string
  totalMarks: number
  className: string
  subjectName: string
  results: number
}

export interface RecentStudent {
  id: string
  name: string
  email: string
  admissionNo: string
  avatarUrl: string | null
  className: string | null
  sectionName: string | null
  status: string
  enrolledAt: string
}

export interface ResultLite {
  id: string
  examId: string
  title: string
  type: string
  date: string
  subjectName: string
  className: string
  marksObtained: number | null
  totalMarks: number
  passingMarks: number
  percent: number | null
  grade: string | null
  passed: boolean | null
  studentId: string
  studentName: string
}

export interface StudentLite {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  admissionNo: string
  rollNo: string | null
  className: string
  sectionName: string
  sectionId: string
}

interface BaseSummary {
  counts: Record<string, number>
  attendance: { today: TodayAttendance | null; trend: Trend }
  today: TodaySchedule
}

export interface AdminSummary extends BaseSummary {
  role: "ADMIN"
  academicYear: { name: string; startDate: string; endDate: string } | null
  counts: {
    students: number
    activeStudents: number
    teachers: number
    sections: number
    classes: number
    exams: number
    notices: number
  }
  fees: FeePosition
  recentStudents: RecentStudent[]
  exams: ExamRowLite[]
}

export interface TeacherSummary extends BaseSummary {
  role: "TEACHER"
  teacher: { employeeNo: string; designation: string; department: string }
  counts: { lessons: number; sections: number; classes: number; subjects: number; students: number }
  sections: { sectionId: string; sectionName: string; className: string; studentCount: number }[]
  exams: ExamRowLite[]
}

export interface LearnerSummary extends BaseSummary {
  role: "STUDENT" | "PARENT"
  counts: { students: number; sections: number; subjects: number; notices: number }
  students: StudentLite[]
  fees: FeePosition | null
  results: ResultLite[]
}

export type DashboardSummary = AdminSummary | TeacherSummary | LearnerSummary

export function useDashboardSummary() {
  const query = useApiQuery<DashboardSummary>("/dashboard/summary", { refetchInterval: 120 })
  return {
    summary: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export const prettyTime = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  const hour = h ?? 0
  const suffix = hour >= 12 ? "PM" : "AM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${String(m ?? 0).padStart(2, "0")} ${suffix}`
}

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

/** Compact money: 1.28M / 87.8K / 12,000 — dashboard cards only. */
export function money(value: number) {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 10_000) return `${Math.round(value / 1000)}K`
  return value.toLocaleString("en-GB")
}

export const gradeTone = (grade: string | null) => {
  if (!grade) return "bg-muted text-muted-foreground"
  if (grade.startsWith("A")) return "bg-emerald-100 text-emerald-700"
  if (grade === "B" || grade === "C") return "bg-blue-100 text-blue-700"
  if (grade === "D" || grade === "E") return "bg-amber-100 text-amber-700"
  return "bg-rose-100 text-rose-700"
}
