import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, forbidden, notFound } from '../utils/errors.js'
import type { PaginationQuery } from '../utils/pagination.js'
import { buildMeta, type PaginationMeta } from '../utils/response.js'

/**
 * Attendance module.
 *
 * Rules:
 *   ADMIN    — any section, any date; can also correct an already-marked day
 *   TEACHER  — only sections they actually teach (timetable / subject assignment)
 *   STUDENT  — their own attendance history + summary
 *   PARENT   — their children's attendance history + summary
 */

export interface Actor {
  id: string
  role: Role
}

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HOLIDAY'] as const
export type AttendanceStatusValue = (typeof STATUSES)[number]

/** Dates are stored at @db.Date; normalise any input to UTC midnight. */
function dayStart(input: string | Date): Date {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) throw badRequest('Invalid date')
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Section ids a teacher is responsible for. */
async function teacherSectionIds(userId: string): Promise<string[]> {
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } })
  if (!teacher) return []

  const [slots, assignments] = await prisma.$transaction([
    prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id, sectionId: { not: null } },
      select: { sectionId: true },
      distinct: ['sectionId'],
    }),
    prisma.subjectAssignment.findMany({
      where: { teacherId: teacher.id },
      select: { sectionId: true },
      distinct: ['sectionId'],
    }),
  ])

  return [
    ...new Set([
      ...slots.map((s) => s.sectionId),
      ...assignments.map((a) => a.sectionId),
    ]),
  ].filter((s): s is string => !!s)
}

/** Guard: may this actor read/write attendance for this section? */
async function assertSectionAccess(actor: Actor, sectionId: string): Promise<void> {
  if (actor.role === 'ADMIN') return
  if (actor.role === 'TEACHER') {
    const allowed = await teacherSectionIds(actor.id)
    if (!allowed.includes(sectionId)) {
      throw forbidden('You can only manage attendance for sections you teach')
    }
    return
  }
  throw forbidden('You do not have permission to manage attendance')
}

// ─────────────────────────────────────────────────────────────
//  sections the actor can mark
// ─────────────────────────────────────────────────────────────

export interface AttendanceSection {
  id: string
  name: string
  className: string
  level: number
  studentCount: number
}

export async function listAttendanceSections(actor: Actor): Promise<AttendanceSection[]> {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can mark attendance')
  }

  const where: Prisma.SectionWhereInput =
    actor.role === 'ADMIN' ? {} : { id: { in: await teacherSectionIds(actor.id) } }

  const sections = await prisma.section.findMany({
    where,
    select: {
      id: true,
      name: true,
      class: { select: { name: true, level: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: [{ class: { level: 'desc' } }, { name: 'asc' }],
  })

  return sections.map((s) => ({
    id: s.id,
    name: s.name,
    className: s.class.name,
    level: s.class.level,
    studentCount: s._count.enrollments,
  }))
}

// ─────────────────────────────────────────────────────────────
//  roster for a section + date
// ─────────────────────────────────────────────────────────────

export interface RosterEntry {
  studentId: string
  name: string
  admissionNo: string
  rollNo: string | null
  avatarUrl: string | null
  status: AttendanceStatusValue | null
  remarks: string | null
}

export interface SectionRoster {
  section: { id: string; name: string; className: string }
  date: string
  marked: boolean
  entries: RosterEntry[]
  summary: {
    PRESENT: number
    ABSENT: number
    LATE: number
    EXCUSED: number
    HOLIDAY: number
    UNMARKED: number
    total: number
  }
}

export async function getSectionRoster(
  actor: Actor,
  sectionId: string,
  dateInput: string,
): Promise<SectionRoster> {
  await assertSectionAccess(actor, sectionId)

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true, name: true, class: { select: { name: true } } },
  })
  if (!section) throw notFound('Section')

  const date = dayStart(dateInput)

  const [enrollments, marks] = await prisma.$transaction([
    prisma.enrollment.findMany({
      where: { sectionId, status: 'ACTIVE' },
      select: {
        rollNo: true,
        student: {
          select: {
            id: true,
            admissionNo: true,
            rollNo: true,
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { sectionId, date },
      select: { studentId: true, status: true, remarks: true },
    }),
  ])

  const markByStudent = new Map(marks.map((m) => [m.studentId, m]))

  const entries: RosterEntry[] = enrollments
    .map((e) => {
      const mark = markByStudent.get(e.student.id)
      return {
        studentId: e.student.id,
        name: e.student.user.name,
        admissionNo: e.student.admissionNo,
        rollNo: e.rollNo ?? e.student.rollNo,
        avatarUrl: e.student.user.avatarUrl,
        status: (mark?.status as AttendanceStatusValue | undefined) ?? null,
        remarks: mark?.remarks ?? null,
      }
    })
    .sort((a, b) => (a.rollNo ?? '').localeCompare(b.rollNo ?? '', undefined, { numeric: true }))

  const summary: Record<string, number> = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, HOLIDAY: 0, UNMARKED: 0 }
  for (const e of entries) {
    const key = e.status ?? 'UNMARKED'
    summary[key] = (summary[key] ?? 0) + 1
  }

  return {
    section: { id: section.id, name: section.name, className: section.class.name },
    date: isoDay(date),
    marked: marks.length > 0,
    entries,
    summary: { ...summary, total: entries.length } as SectionRoster['summary'],
  }
}

// ─────────────────────────────────────────────────────────────
//  bulk mark (upsert per student)
// ─────────────────────────────────────────────────────────────

export interface BulkMarkInput {
  sectionId: string
  date: string
  entries: { studentId: string; status: AttendanceStatusValue; remarks?: string | null }[]
}

export async function bulkMarkAttendance(actor: Actor, input: BulkMarkInput) {
  await assertSectionAccess(actor, input.sectionId)

  const date = dayStart(input.date)
  if (date.getTime() > dayStart(new Date()).getTime()) {
    throw badRequest('Cannot mark attendance for a future date')
  }

  if (input.entries.length === 0) throw badRequest('No attendance entries supplied')

  // Every student must actually be enrolled in this section.
  const enrolled = await prisma.enrollment.findMany({
    where: { sectionId: input.sectionId, status: 'ACTIVE' },
    select: { studentId: true },
  })
  const enrolledIds = new Set(enrolled.map((e) => e.studentId))
  const stray = input.entries.filter((e) => !enrolledIds.has(e.studentId))
  if (stray.length > 0) {
    throw badRequest(`${stray.length} student(s) are not enrolled in this section`)
  }

  const duplicates = input.entries.length !== new Set(input.entries.map((e) => e.studentId)).size
  if (duplicates) throw badRequest('Duplicate students in the submission')

  // A 40-student class used to issue 40 separate round-trips inside one
  // transaction. A single INSERT ... ON CONFLICT keeps it to one statement,
  // which matters a lot when a whole school marks attendance at 08:00.
  await prisma.$executeRaw`
    INSERT INTO "attendance" ("id", "studentId", "sectionId", "date", "status", "remarks", "markedBy", "createdAt")
    SELECT
      gen_random_uuid()::text,
      v."studentId",
      ${input.sectionId},
      ${date}::date,
      v."status"::"AttendanceStatus",
      v."remarks",
      ${actor.id},
      NOW()
    FROM (
      VALUES ${Prisma.join(
        input.entries.map((entry) => Prisma.sql`(
          ${entry.studentId}::text,
          ${entry.status}::text,
          ${entry.remarks ?? null}::text
        )`),
      )}
    ) AS v("studentId", "status", "remarks")
    ON CONFLICT ("studentId", "date") DO UPDATE SET
      "status"    = EXCLUDED."status",
      "remarks"   = EXCLUDED."remarks",
      "sectionId" = EXCLUDED."sectionId",
      "markedBy"  = EXCLUDED."markedBy"
  `

  const summary = input.entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1
    return acc
  }, {})

  return {
    sectionId: input.sectionId,
    date: isoDay(date),
    saved: input.entries.length,
    summary,
  }
}

// ─────────────────────────────────────────────────────────────
//  history — per student (scoped) or per section (staff)
// ─────────────────────────────────────────────────────────────

export interface HistoryFilters extends PaginationQuery {
  studentId?: string
  sectionId?: string
  status?: AttendanceStatusValue
  from?: string
  to?: string
}

export interface HistoryRow {
  id: string
  date: string
  status: AttendanceStatusValue
  remarks: string | null
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  sectionName: string
}

export async function listAttendance(
  actor: Actor,
  filters: HistoryFilters,
): Promise<{ items: HistoryRow[]; meta: PaginationMeta }> {
  const where: Prisma.AttendanceWhereInput = {}

  if (filters.status) where.status = filters.status
  if (filters.sectionId) where.sectionId = filters.sectionId
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: dayStart(filters.from) } : {}),
      ...(filters.to ? { lte: dayStart(filters.to) } : {}),
    }
  }

  // ── role scoping ────────────────────────────────────────────
  if (actor.role === 'STUDENT') {
    where.student = { userId: actor.id }
  } else if (actor.role === 'PARENT') {
    where.student = { guardians: { some: { parent: { userId: actor.id } } } }
  } else if (actor.role === 'TEACHER') {
    const allowed = await teacherSectionIds(actor.id)
    where.sectionId = filters.sectionId
      ? allowed.includes(filters.sectionId)
        ? filters.sectionId
        : '__none__'
      : { in: allowed }
  }

  if (filters.studentId) where.studentId = filters.studentId

  if (filters.search) {
    where.student = {
      OR: [
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { admissionNo: { contains: filters.search, mode: 'insensitive' } },
      ],
    }
  }

  const [rows, total] = await prisma.$transaction([
    prisma.attendance.findMany({
      where,
      orderBy: [{ date: 'desc' }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        date: true,
        status: true,
        remarks: true,
        student: {
          select: {
            id: true,
            admissionNo: true,
            user: { select: { name: true } },
            class: { select: { name: true } },
            enrollments: {
              where: { status: 'ACTIVE' },
              take: 1,
              select: { section: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.attendance.count({ where }),
  ])

  return {
    items: rows.map((r) => ({
      id: r.id,
      date: isoDay(r.date),
      status: r.status as AttendanceStatusValue,
      remarks: r.remarks,
      studentId: r.student.id,
      studentName: r.student.user.name,
      admissionNo: r.student.admissionNo,
      className: r.student.class?.name ?? '—',
      sectionName: r.student.enrollments[0]?.section?.name ?? '—',
    })),
    meta: buildMeta(filters.page, filters.limit, total),
  }
}

// ─────────────────────────────────────────────────────────────
//  summary — rate + status breakdown
// ─────────────────────────────────────────────────────────────

export interface AttendanceSummary {
  scope: 'self' | 'section'
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

export async function getAttendanceSummary(
  actor: Actor,
  params: { studentId?: string; sectionId?: string; from?: string; to?: string },
): Promise<AttendanceSummary> {
  const to = params.to ? dayStart(params.to) : dayStart(new Date())
  const from = params.from
    ? dayStart(params.from)
    : new Date(to.getTime() - 1000 * 60 * 60 * 24 * 120) // default: last 120 days

  const where: Prisma.AttendanceWhereInput = { date: { gte: from, lte: to } }
  let scope: 'self' | 'section' = 'self'

  if (params.sectionId) {
    await assertSectionAccess(actor, params.sectionId)
    where.sectionId = params.sectionId
    scope = 'section'
  } else if (actor.role === 'STUDENT') {
    where.student = { userId: actor.id }
  } else if (actor.role === 'PARENT') {
    where.student = { guardians: { some: { parent: { userId: actor.id } } } }
  } else if (actor.role === 'TEACHER') {
    const allowed = await teacherSectionIds(actor.id)
    where.sectionId = { in: allowed }
    scope = 'section'
  }

  if (params.studentId) {
    // staff can look up a specific student; learners are already scoped above
    if (actor.role === 'ADMIN' || actor.role === 'TEACHER') where.studentId = params.studentId
    scope = 'self'
  }

  const rows = await prisma.attendance.findMany({
    where,
    select: { date: true, status: true },
    orderBy: { date: 'asc' },
  })

  const counts = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, HOLIDAY: 0 }
  const monthly = new Map<string, { present: number; absent: number; late: number }>()

  for (const r of rows) {
    const status = r.status as keyof typeof counts
    if (status in counts) counts[status] += 1

    const month = isoDay(r.date).slice(0, 7)
    const bucket = monthly.get(month) ?? { present: 0, absent: 0, late: 0 }
    if (status === 'PRESENT') bucket.present += 1
    if (status === 'ABSENT') bucket.absent += 1
    if (status === 'LATE') bucket.late += 1
    monthly.set(month, bucket)
  }

  const countable = counts.PRESENT + counts.ABSENT + counts.LATE + counts.EXCUSED
  const rate = countable === 0 ? null : Math.round(((counts.PRESENT + counts.LATE) / countable) * 1000) / 10

  return {
    scope,
    ...(params.studentId ? { studentId: params.studentId } : {}),
    ...(params.sectionId ? { sectionId: params.sectionId } : {}),
    from: isoDay(from),
    to: isoDay(to),
    totalDays: rows.length,
    present: counts.PRESENT,
    absent: counts.ABSENT,
    late: counts.LATE,
    excused: counts.EXCUSED,
    holiday: counts.HOLIDAY,
    rate,
    monthly: [...monthly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => {
        const denom = v.present + v.absent + v.late
        return {
          month,
          present: v.present,
          absent: v.absent,
          late: v.late,
          rate: denom === 0 ? null : Math.round(((v.present + v.late) / denom) * 1000) / 10,
        }
      }),
  }
}

/** Admin/teacher view: today's status across the whole school (or their sections). */
export async function getTodayOverview(actor: Actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can view the attendance overview')
  }

  const today = dayStart(new Date())

  const allowedSections = actor.role === 'ADMIN' ? null : await teacherSectionIds(actor.id)
  const attendanceWhere: Prisma.AttendanceWhereInput = {
    date: today,
    ...(allowedSections ? { sectionId: { in: allowedSections } } : {}),
  }
  const sectionWhere: Prisma.SectionWhereInput = allowedSections
    ? { id: { in: allowedSections } }
    : {}

  const [todaysMarks, sections] = await prisma.$transaction([
    prisma.attendance.findMany({
      where: attendanceWhere,
      select: { status: true },
    }),
    prisma.section.findMany({
      where: sectionWhere,
      select: {
        id: true,
        name: true,
        class: { select: { name: true, level: true } },
        _count: { select: { enrollments: true } },
        attendance: { where: { date: today }, select: { status: true } },
      },
      orderBy: [{ class: { level: 'desc' } }, { name: 'asc' }],
    }),
  ])

  const byStatus: Record<string, number> = {}
  for (const m of todaysMarks) {
    byStatus[m.status] = (byStatus[m.status] ?? 0) + 1
  }

  const sectionRows = sections.map((s) => {
    const marked = s.attendance.length
    const present = s.attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length
    return {
      id: s.id,
      name: s.name,
      className: s.class.name,
      students: s._count.enrollments,
      marked,
      present,
      rate: marked === 0 ? null : Math.round((present / marked) * 1000) / 10,
      complete: marked >= s._count.enrollments,
    }
  })

  return {
    date: isoDay(today),
    byStatus: {
      present: byStatus['PRESENT'] ?? 0,
      absent: byStatus['ABSENT'] ?? 0,
      late: byStatus['LATE'] ?? 0,
      excused: byStatus['EXCUSED'] ?? 0,
    },
    sections: sectionRows,
    sectionsMarked: sectionRows.filter((s) => s.marked > 0).length,
    sectionsTotal: sectionRows.length,
  }
}
