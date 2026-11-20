import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { forbidden } from '../utils/errors.js'

/**
 * Reports module (ADMIN only).
 *
 * Every report is computed on read — no materialised tables — so numbers always
 * match the live data. All endpoints return plain JSON so the frontend can
 * render tables and charts, and CSV export is generated from the same rows.
 */

export interface Actor {
  id: string
  role: Role
}

function money(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  return Math.round(Number(value.toString()) * 100) / 100
}

function pct(part: number, whole: number): number | null {
  if (whole === 0) return null
  return Math.round((part / whole) * 1000) / 10
}

function assertAdmin(actor: Actor) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can view reports')
}

// ─────────────────────────────────────────────────────────────
//  Fees by class
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

export async function feeReportByClass(actor: Actor): Promise<FeeReportRow[]> {
  assertAdmin(actor)

  const classes = await prisma.class.findMany({
    orderBy: { level: 'desc' },
    select: { id: true, name: true, sections: { select: { id: true } } },
  })

  const invoices = await prisma.invoice.findMany({
    select: {
      totalAmount: true,
      paidAmount: true,
      status: true,
      student: { select: { classId: true } },
    },
  })

  const buckets = new Map<string, { billed: number; paid: number; invoices: number; overdue: number }>()
  for (const invoice of invoices) {
    const classId = invoice.student.classId
    if (!classId) continue
    const bucket = buckets.get(classId) ?? { billed: 0, paid: 0, invoices: 0, overdue: 0 }
    bucket.billed += money(invoice.totalAmount)
    bucket.paid += money(invoice.paidAmount)
    bucket.invoices += 1
    if (invoice.status === 'OVERDUE') bucket.overdue += 1
    buckets.set(classId, bucket)
  }

  const counts = await prisma.student.groupBy({
    by: ['classId'],
    where: { classId: { not: null } },
    _count: { _all: true },
  })
  const studentCounts = new Map(counts.map((c) => [c.classId, c._count._all]))

  return classes.map((cls) => {
    const bucket = buckets.get(cls.id) ?? { billed: 0, paid: 0, invoices: 0, overdue: 0 }
    return {
      classId: cls.id,
      className: cls.name,
      students: studentCounts.get(cls.id) ?? 0,
      invoices: bucket.invoices,
      billed: Math.round(bucket.billed * 100) / 100,
      paid: Math.round(bucket.paid * 100) / 100,
      outstanding: Math.round((bucket.billed - bucket.paid) * 100) / 100,
      collectionRate: pct(bucket.paid, bucket.billed),
      overdue: bucket.overdue,
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  Attendance by class (given window)
// ─────────────────────────────────────────────────────────────

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

export async function attendanceReport(actor: Actor, days = 30): Promise<AttendanceReportRow[]> {
  assertAdmin(actor)

  const from = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()))
  from.setUTCDate(from.getUTCDate() - (days - 1))

  const [sections, marks, enrollments] = await Promise.all([
    prisma.section.findMany({
      orderBy: [{ class: { level: 'desc' } }, { name: 'asc' }],
      select: { id: true, name: true, class: { select: { id: true, name: true } } },
    }),
    prisma.attendance.groupBy({
      by: ['sectionId', 'status'],
      where: { date: { gte: from } },
      _count: { _all: true },
    }),
    prisma.enrollment.groupBy({
      by: ['sectionId'],
      where: { status: 'ACTIVE' },
      _count: { _all: true },
    }),
  ])

  const buckets = new Map<string, { present: number; absent: number; late: number; marked: number }>()
  for (const row of marks) {
    const bucket = buckets.get(row.sectionId) ?? { present: 0, absent: 0, late: 0, marked: 0 }
    bucket.marked += row._count._all
    if (row.status === 'PRESENT') bucket.present += row._count._all
    else if (row.status === 'ABSENT') bucket.absent += row._count._all
    else if (row.status === 'LATE') bucket.late += row._count._all
    buckets.set(row.sectionId, bucket)
  }

  const roster = new Map(enrollments.map((e) => [e.sectionId, e._count._all]))

  return sections.map((section) => {
    const bucket = buckets.get(section.id) ?? { present: 0, absent: 0, late: 0, marked: 0 }
    return {
      classId: section.class.id,
      className: section.class.name,
      sectionId: section.id,
      sectionName: section.name,
      students: roster.get(section.id) ?? 0,
      marked: bucket.marked,
      present: bucket.present,
      absent: bucket.absent,
      late: bucket.late,
      rate: pct(bucket.present + bucket.late, bucket.marked),
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  Academic performance by class
// ─────────────────────────────────────────────────────────────

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

export async function performanceReport(actor: Actor, limit = 40): Promise<PerformanceReportRow[]> {
  assertAdmin(actor)

  const exams = await prisma.exam.findMany({
    where: { status: { in: ['COMPLETED', 'PUBLISHED'] } },
    orderBy: { examDate: 'desc' },
    take: limit,
    select: {
      name: true,
      examDate: true,
      totalMarks: true,
      passingMarks: true,
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
      results: { select: { marksObtained: true } },
    },
  })

  return exams.map((exam) => {
    const marks = exam.results.map((r) => money(r.marksObtained))
    const passed = marks.filter((m) => m >= exam.passingMarks).length
    return {
      classId: exam.class.id,
      className: exam.class.name,
      subjectId: exam.subject.id,
      subjectName: exam.subject.name,
      examTitle: exam.name,
      examDate: exam.examDate.toISOString(),
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      results: marks.length,
      average: marks.length === 0 ? null : Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10,
      highest: marks.length === 0 ? null : Math.max(...marks),
      lowest: marks.length === 0 ? null : Math.min(...marks),
      passRate: pct(passed, marks.length),
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  Enrolment by class
// ─────────────────────────────────────────────────────────────

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

export async function enrolmentReport(actor: Actor): Promise<EnrolmentReportRow[]> {
  assertAdmin(actor)

  const classes = await prisma.class.findMany({
    orderBy: { level: 'desc' },
    select: {
      id: true,
      name: true,
      level: true,
      capacity: true,
      _count: { select: { sections: true } },
      students: { select: { gender: true, status: true } },
    },
  })

  return classes.map((cls) => {
    const genderSplit = { male: 0, female: 0, other: 0 }
    const statusSplit: Record<string, number> = {}

    for (const student of cls.students) {
      if (student.gender === 'MALE') genderSplit.male += 1
      else if (student.gender === 'FEMALE') genderSplit.female += 1
      else genderSplit.other += 1
      statusSplit[student.status] = (statusSplit[student.status] ?? 0) + 1
    }

    const capacity = cls.capacity * Math.max(1, cls._count.sections)

    return {
      classId: cls.id,
      className: cls.name,
      level: cls.level,
      sections: cls._count.sections,
      capacity,
      students: cls.students.length,
      utilisation: pct(cls.students.length, capacity),
      genderSplit,
      statusSplit,
    }
  })
}

// ─────────────────────────────────────────────────────────────
//  CSV helpers
// ─────────────────────────────────────────────────────────────

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return ''
    const text = String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  return [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))].join('\n')
}

export async function reportsCsv(actor: Actor, type: string, days = 30): Promise<{ filename: string; csv: string }> {
  assertAdmin(actor)
  const stamp = new Date().toISOString().slice(0, 10)

  if (type === 'fees') {
    const rows = await feeReportByClass(actor)
    return {
      filename: `fees-by-class-${stamp}.csv`,
      csv: toCsv(
        ['Class', 'Students', 'Invoices', 'Billed', 'Paid', 'Outstanding', 'Collection %', 'Overdue'],
        rows.map((r) => [r.className, r.students, r.invoices, r.billed, r.paid, r.outstanding, r.collectionRate, r.overdue]),
      ),
    }
  }

  if (type === 'attendance') {
    const rows = await attendanceReport(actor, days)
    return {
      filename: `attendance-${days}d-${stamp}.csv`,
      csv: toCsv(
        ['Class', 'Section', 'Students', 'Marked', 'Present', 'Absent', 'Late', 'Rate %'],
        rows.map((r) => [r.className, r.sectionName, r.students, r.marked, r.present, r.absent, r.late, r.rate]),
      ),
    }
  }

  if (type === 'performance') {
    const rows = await performanceReport(actor)
    return {
      filename: `performance-${stamp}.csv`,
      csv: toCsv(
        ['Class', 'Subject', 'Exam', 'Date', 'Results', 'Average', 'Highest', 'Lowest', 'Pass %'],
        rows.map((r) => [
          r.className,
          r.subjectName,
          r.examTitle,
          r.examDate.slice(0, 10),
          r.results,
          r.average,
          r.highest,
          r.lowest,
          r.passRate,
        ]),
      ),
    }
  }

  const rows = await enrolmentReport(actor)
  return {
    filename: `enrolment-${stamp}.csv`,
    csv: toCsv(
      ['Class', 'Sections', 'Capacity', 'Students', 'Utilisation %', 'Male', 'Female', 'Other'],
      rows.map((r) => [
        r.className,
        r.sections,
        r.capacity,
        r.students,
        r.utilisation,
        r.genderSplit.male,
        r.genderSplit.female,
        r.genderSplit.other,
      ]),
    ),
  }
}
