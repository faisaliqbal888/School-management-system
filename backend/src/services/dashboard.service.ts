import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { forbidden } from '../utils/errors.js'

/**
 * Dashboard summary.
 *
 * One endpoint, role-shaped payloads — the UI never has to ask for data the
 * caller is not entitled to see:
 *
 *   ADMIN    school-wide counts, attendance trend, fee collection, recent
 *            enrolments, upcoming exams, today's lessons
 *   TEACHER  own lessons/sections/students, attendance trend for own sections
 *   STUDENT  own attendance, latest results, fees (own only), today's lessons
 *   PARENT   the same across all of their children
 *
 * Financial blocks are never included for TEACHER, and for learners they are
 * scoped to that learner's (or their children's) own invoices.
 */

export interface Actor {
  id: string
  role: Role
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

function dayStart(input: Date): Date {
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

function money(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  return Math.round(Number(value.toString()) * 100) / 100
}

function pct(part: number, whole: number): number | null {
  if (whole === 0) return null
  return Math.round((part / whole) * 1000) / 10
}

const decimalToNumber = (value: Prisma.Decimal | null) => (value === null ? null : money(value))

/** Attendance % + per-day trend for the trailing `days` days, oldest first. */
async function attendanceTrend(where: Prisma.AttendanceWhereInput, days = 7) {
  const from = addDays(dayStart(new Date()), -(days - 1))

  const rows = await prisma.attendance.groupBy({
    by: ['date', 'status'],
    where: { ...where, date: { gte: from } },
    _count: { _all: true },
  })

  const buckets = new Map<string, { present: number; absent: number; late: number; total: number }>()
  for (let i = 0; i < days; i++) {
    buckets.set(addDays(from, i).toISOString().slice(0, 10), { present: 0, absent: 0, late: 0, total: 0 })
  }

  for (const row of rows) {
    const bucket = buckets.get(row.date.toISOString().slice(0, 10))
    if (!bucket) continue
    const count = row._count._all
    bucket.total += count
    if (row.status === 'PRESENT') bucket.present += count
    else if (row.status === 'LATE') bucket.late += count
    else if (row.status === 'ABSENT') bucket.absent += count
  }

  const series = [...buckets.entries()].map(([date, bucket]) => ({
    date,
    present: bucket.present,
    absent: bucket.absent,
    late: bucket.late,
    total: bucket.total,
    rate: pct(bucket.present + bucket.late, bucket.total),
  }))

  const totals = series.reduce(
    (acc, day) => ({
      present: acc.present + day.present,
      absent: acc.absent + day.absent,
      late: acc.late + day.late,
      total: acc.total + day.total,
    }),
    { present: 0, absent: 0, late: 0, total: 0 },
  )

  return { series, overall: { ...totals, rate: pct(totals.present + totals.late, totals.total) } }
}

/** Fee position for a scope of invoices (empty scope = nothing billed yet). */
async function feePosition(where: Prisma.InvoiceWhereInput) {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

  const [aggregate, statusRows, monthPayments] = await prisma.$transaction([
    prisma.invoice.aggregate({ where, _sum: { totalAmount: true, paidAmount: true } }),
    prisma.invoice.findMany({ where, select: { status: true } }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: monthStart }, invoice: where },
      _sum: { amount: true },
    }),
  ])

  const billed = money(aggregate._sum.totalAmount)
  const paid = money(aggregate._sum.paidAmount)

  const statusCounts: Record<string, number> = {}
  for (const row of statusRows) statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1

  return {
    billed,
    paid,
    outstanding: Math.round((billed - paid) * 100) / 100,
    collectionRate: pct(paid, billed),
    collectedThisMonth: money(monthPayments._sum.amount),
    invoiceCount: statusRows.length,
    overdue: statusCounts['OVERDUE'] ?? 0,
    pending: (statusCounts['PENDING'] ?? 0) + (statusCounts['PARTIAL'] ?? 0),
    currency: 'PKR' as const,
  }
}

/** Today's timetable for a section or teacher scope, with a "now" flag. */
async function todayLessons(where: Prisma.TimetableSlotWhereInput) {
  const today = DAYS[new Date().getUTCDay()] ?? 'MONDAY'
  const now = new Date()
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes()
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }

  const slots = await prisma.timetableSlot.findMany({
    where: { ...where, dayOfWeek: today },
    orderBy: { startTime: 'asc' },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      roomNo: true,
      subject: { select: { name: true } },
      teacher: { select: { user: { select: { name: true } } } },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  })

  return {
    day: today,
    lessons: slots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      roomNo: slot.roomNo,
      subject: slot.subject.name,
      teacher: slot.teacher?.user.name ?? null,
      className: `${slot.class.name}${slot.section ? `-${slot.section.name}` : ''}`,
      isCurrent: minutes >= toMinutes(slot.startTime) && minutes < toMinutes(slot.endTime),
    })),
  }
}

const EXAM_SELECT = {
  id: true,
  name: true,
  type: true,
  status: true,
  examDate: true,
  totalMarks: true,
  class: { select: { name: true } },
  subject: { select: { name: true } },
  _count: { select: { results: true } },
} satisfies Prisma.ExamSelect

type ExamRecord = Prisma.ExamGetPayload<{ select: typeof EXAM_SELECT }>

const toExamRow = (exam: ExamRecord) => ({
  id: exam.id,
  title: exam.name,
  type: exam.type,
  status: exam.status,
  date: exam.examDate.toISOString(),
  totalMarks: exam.totalMarks,
  className: exam.class.name,
  subjectName: exam.subject.name,
  results: exam._count.results,
})

// ─────────────────────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────────────────────

async function adminSummary() {
  const today = dayStart(new Date())

  const [
    students,
    activeStudents,
    teachers,
    sections,
    classes,
    todayMarks,
    fee,
    trend,
    recentStudents,
    upcomingExams,
    notices,
    examCount,
    year,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { status: 'ACTIVE' } }),
    prisma.teacher.count({ where: { status: 'ACTIVE' } }),
    prisma.section.count(),
    prisma.class.count(),
    prisma.attendance.findMany({ where: { date: today }, select: { status: true } }),
    feePosition({}),
    attendanceTrend({}, 7),
    prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        admissionNo: true,
        status: true,
        createdAt: true,
        user: { select: { name: true, email: true, avatarUrl: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          select: { class: { select: { name: true } }, section: { select: { name: true } } },
        },
      },
    }),
    prisma.exam.findMany({
      where: { status: { in: ['SCHEDULED', 'ONGOING'] } },
      orderBy: { examDate: 'asc' },
      take: 5,
      select: EXAM_SELECT,
    }),
    prisma.notification.count(),
    prisma.exam.count(),
    prisma.academicYear.findFirst({
      where: { isCurrent: true },
      select: { name: true, startDate: true, endDate: true },
    }),
  ])

  const presentToday = todayMarks.filter((m) => m.status === 'PRESENT' || m.status === 'LATE').length

  return {
    role: 'ADMIN' as const,
    academicYear: year ? { name: year.name, startDate: year.startDate, endDate: year.endDate } : null,
    counts: { students, activeStudents, teachers, sections, classes, exams: examCount, notices },
    attendance: {
      today: {
        marked: todayMarks.length,
        present: presentToday,
        absent: todayMarks.filter((m) => m.status === 'ABSENT').length,
        late: todayMarks.filter((m) => m.status === 'LATE').length,
        rate: pct(presentToday, todayMarks.length),
      },
      trend,
    },
    fees: fee,
    recentStudents: recentStudents.map((student) => ({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      admissionNo: student.admissionNo,
      avatarUrl: student.user.avatarUrl,
      className: student.enrollments[0]?.class.name ?? null,
      sectionName: student.enrollments[0]?.section.name ?? null,
      status: student.status,
      enrolledAt: student.createdAt.toISOString(),
    })),
    exams: upcomingExams.map(toExamRow),
    today: await todayLessons({}),
  }
}

// ─────────────────────────────────────────────────────────────
//  TEACHER
// ─────────────────────────────────────────────────────────────

async function teacherSummary(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true, employeeNo: true, designation: true, department: true },
  })
  if (!teacher) throw forbidden('No teacher profile is linked to this account')

  const [slots, subjectLinks, exams] = await Promise.all([
    prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id },
      select: { classId: true, sectionId: true, subjectId: true },
    }),
    prisma.teacherSubject.findMany({ where: { teacherId: teacher.id }, select: { subjectId: true } }),
    prisma.exam.findMany({
      where: { createdById: teacher.id },
      orderBy: { examDate: 'desc' },
      take: 5,
      select: EXAM_SELECT,
    }),
  ])

  const sectionIds = [...new Set(slots.map((s) => s.sectionId).filter((id): id is string => Boolean(id)))]
  const classIds = [...new Set(slots.map((s) => s.classId))]
  const subjectIds = [...new Set([...slots.map((s) => s.subjectId), ...subjectLinks.map((s) => s.subjectId)])]

  const [students, trend, sectionRows] = await Promise.all([
    sectionIds.length > 0
      ? prisma.enrollment.count({ where: { sectionId: { in: sectionIds }, status: 'ACTIVE' } })
      : Promise.resolve(0),
    sectionIds.length > 0
      ? attendanceTrend({ sectionId: { in: sectionIds } }, 7)
      : Promise.resolve({ series: [], overall: { present: 0, absent: 0, late: 0, total: 0, rate: null } }),
    sectionIds.length > 0
      ? prisma.section.findMany({
          where: { id: { in: sectionIds } },
          orderBy: [{ class: { level: 'desc' } }, { name: 'asc' }],
          select: {
            id: true,
            name: true,
            class: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
        })
      : Promise.resolve([] as { id: string; name: string; class: { name: string }; _count: { enrollments: number } }[]),
  ])

  const todayMarks = await prisma.attendance.findMany({
    where: { sectionId: { in: sectionIds }, date: dayStart(new Date()) },
    select: { status: true },
  })
  const presentToday = todayMarks.filter((m) => m.status === 'PRESENT' || m.status === 'LATE').length

  return {
    role: 'TEACHER' as const,
    teacher: {
      employeeNo: teacher.employeeNo,
      designation: teacher.designation,
      department: teacher.department,
    },
    counts: {
      lessons: slots.length,
      sections: sectionIds.length,
      classes: classIds.length,
      subjects: subjectIds.length,
      students,
    },
    sections: sectionRows.map((section) => ({
      sectionId: section.id,
      sectionName: section.name,
      className: section.class.name,
      studentCount: section._count.enrollments,
    })),
    attendance: {
      today:
        todayMarks.length === 0
          ? null
          : {
              marked: todayMarks.length,
              present: presentToday,
              absent: todayMarks.filter((m) => m.status === 'ABSENT').length,
              late: todayMarks.filter((m) => m.status === 'LATE').length,
              rate: pct(presentToday, todayMarks.length),
            },
      trend,
    },
    exams: exams.map(toExamRow),
    today: await todayLessons({ teacherId: teacher.id }),
  }
}

// ─────────────────────────────────────────────────────────────
//  LEARNERS (student + parent)
// ─────────────────────────────────────────────────────────────

async function learnerStudentIds(actor: Actor): Promise<string[]> {
  if (actor.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: actor.id }, select: { id: true } })
    return student ? [student.id] : []
  }

  const links = await prisma.guardian.findMany({
    where: { parent: { userId: actor.id } },
    select: { studentId: true },
  })
  return [...new Set(links.map((link) => link.studentId))]
}

async function learnerSummary(actor: Actor) {
  const ids = await learnerStudentIds(actor)

  const emptyTrend = {
    series: [] as { date: string; present: number; absent: number; late: number; total: number; rate: number | null }[],
    overall: { present: 0, absent: 0, late: 0, total: 0, rate: null as number | null },
  }

  if (ids.length === 0) {
    return {
      role: actor.role as 'STUDENT' | 'PARENT',
      counts: { students: 0, sections: 0, subjects: 0, notices: 0 },
      students: [],
      attendance: { today: null, trend: emptyTrend },
      fees: null,
      results: [],
      today: { day: DAYS[new Date().getUTCDay()] ?? 'MONDAY', lessons: [] },
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: { in: ids }, status: 'ACTIVE' },
    select: {
      sectionId: true,
      student: {
        select: {
          id: true,
          admissionNo: true,
          rollNo: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
          class: { select: { name: true } },
        },
      },
      class: { select: { name: true } },
      section: { select: { name: true } },
    },
  })

  const sectionIds = [...new Set(enrollments.map((e) => e.sectionId))]

  const [todayMarks, trend, fee, results, notices] = await Promise.all([
    prisma.attendance.findMany({
      where: { studentId: { in: ids }, date: dayStart(new Date()) },
      select: { status: true },
    }),
    attendanceTrend({ studentId: { in: ids } }, 7),
    feePosition({ studentId: { in: ids } }),
    prisma.examResult.findMany({
      where: { studentId: { in: ids }, exam: { status: 'PUBLISHED' } },
      orderBy: { exam: { examDate: 'desc' } },
      take: 8,
      select: {
        id: true,
        marksObtained: true,
        grade: true,
        remarks: true,
        exam: {
          select: {
            id: true,
            name: true,
            type: true,
            examDate: true,
            totalMarks: true,
            passingMarks: true,
            subject: { select: { name: true } },
            class: { select: { name: true } },
          },
        },
        student: { select: { id: true, user: { select: { name: true } } } },
      },
    }),
    prisma.notification.count(),
  ])

  const presentToday = todayMarks.filter((m) => m.status === 'PRESENT' || m.status === 'LATE').length

  return {
    role: actor.role as 'STUDENT' | 'PARENT',
    counts: {
      students: ids.length,
      sections: sectionIds.length,
      subjects: new Set(results.map((r) => r.exam.subject.name)).size,
      notices,
    },
    students: enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      name: enrollment.student.user.name,
      email: enrollment.student.user.email,
      avatarUrl: enrollment.student.user.avatarUrl,
      admissionNo: enrollment.student.admissionNo,
      rollNo: enrollment.student.rollNo,
      className: enrollment.class.name,
      sectionName: enrollment.section.name,
      sectionId: enrollment.sectionId,
    })),
    attendance: {
      today:
        todayMarks.length === 0
          ? null
          : {
              marked: todayMarks.length,
              present: presentToday,
              absent: todayMarks.filter((m) => m.status === 'ABSENT').length,
              late: todayMarks.filter((m) => m.status === 'LATE').length,
              rate: pct(presentToday, todayMarks.length),
            },
      trend,
    },
    fees: fee,
    results: results.map((result) => {
      const marks = decimalToNumber(result.marksObtained)
      return {
        id: result.id,
        examId: result.exam.id,
        title: result.exam.name,
        type: result.exam.type,
        date: result.exam.examDate.toISOString(),
        subjectName: result.exam.subject.name,
        className: result.exam.class.name,
        marksObtained: marks,
        totalMarks: result.exam.totalMarks,
        passingMarks: result.exam.passingMarks,
        percent: marks === null ? null : pct(marks, result.exam.totalMarks),
        grade: result.grade,
        passed: marks === null ? null : marks >= result.exam.passingMarks,
        studentId: result.student.id,
        studentName: result.student.user.name,
      }
    }),
    today: await todayLessons({ sectionId: { in: sectionIds } }),
  }
}

// ─────────────────────────────────────────────────────────────
//  entry point
// ─────────────────────────────────────────────────────────────

export async function getDashboardSummary(actor: Actor) {
  switch (actor.role) {
    case 'ADMIN':
      return adminSummary()
    case 'TEACHER':
      return teacherSummary(actor.id)
    case 'STUDENT':
    case 'PARENT':
      return learnerSummary(actor)
    default:
      throw forbidden('This role has no dashboard')
  }
}
