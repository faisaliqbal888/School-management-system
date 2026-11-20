import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js'

/**
 * Timetable module.
 *
 * Access rules:
 *   ADMIN    — read/write every section's timetable
 *   TEACHER  — read their own schedule; read sections they teach
 *   STUDENT  — read their own section's timetable
 *   PARENT   — read their children's section timetable
 */

export interface Actor {
  id: string
  role: Role
}

export type DayOfWeekValue =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY'

export const DAYS: DayOfWeekValue[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

export interface SlotRow {
  id: string
  dayOfWeek: DayOfWeekValue
  startTime: string
  endTime: string
  roomNo: string | null
  classId: string
  className: string
  sectionId: string | null
  sectionName: string | null
  subjectId: string
  subjectName: string
  subjectCode: string | null
  teacherId: string | null
  teacherName: string | null
  isCurrent: boolean
}

export interface TimetableGrid {
  scope: {
    kind: 'section' | 'teacher'
    sectionId?: string
    sectionName?: string | null
    className?: string
    teacherId?: string
    teacherName?: string
  }
  days: DayOfWeekValue[]
  periods: { startTime: string; endTime: string }[]
  slots: SlotRow[]
}

async function teacherIdOf(userId: string): Promise<string | null> {
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } })
  return teacher?.id ?? null
}

/** Section a learner belongs to (student or parent's child). */
async function learnerSectionIds(actor: Actor): Promise<string[]> {
  if (actor.role === 'STUDENT') {
    const enrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE', student: { userId: actor.id } },
      select: { sectionId: true },
    })
    return enrollments.map((e) => e.sectionId)
  }

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: 'ACTIVE',
      student: { guardians: { some: { parent: { userId: actor.id } } } },
    },
    select: { sectionId: true },
  })
  return [...new Set(enrollments.map((e) => e.sectionId))]
}

const SLOT_SELECT = {
  id: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  roomNo: true,
  classId: true,
  sectionId: true,
  subjectId: true,
  teacherId: true,
  class: { select: { name: true } },
  section: { select: { name: true } },
  subject: { select: { name: true, code: true } },
  teacher: { select: { user: { select: { name: true } } } },
} satisfies Prisma.TimetableSlotSelect

type SlotRecord = Prisma.TimetableSlotGetPayload<{ select: typeof SLOT_SELECT }>

function toRow(s: SlotRecord): SlotRow {
  const now = new Date()
  const jsDay = now.getUTCDay()
  const today = DAYS[(jsDay + 6) % 7]
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes()
  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }

  return {
    id: s.id,
    dayOfWeek: s.dayOfWeek as DayOfWeekValue,
    startTime: s.startTime,
    endTime: s.endTime,
    roomNo: s.roomNo,
    classId: s.classId,
    className: s.class.name,
    sectionId: s.sectionId,
    sectionName: s.section?.name ?? null,
    subjectId: s.subjectId,
    subjectName: s.subject.name,
    subjectCode: s.subject.code,
    teacherId: s.teacherId,
    teacherName: s.teacher?.user.name ?? null,
    isCurrent: s.dayOfWeek === today && mins >= toMins(s.startTime) && mins < toMins(s.endTime),
  }
}

/** Distinct periods present in a slot list, sorted by start time. */
function periodsOf(rows: SlotRow[]): { startTime: string; endTime: string }[] {
  const seen = new Map<string, { startTime: string; endTime: string }>()
  for (const r of rows) seen.set(`${r.startTime}-${r.endTime}`, { startTime: r.startTime, endTime: r.endTime })
  return [...seen.values()].sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// ─────────────────────────────────────────────────────────────
//  section timetable
// ─────────────────────────────────────────────────────────────

export async function getSectionTimetable(actor: Actor, sectionId: string): Promise<TimetableGrid> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { id: true, name: true, class: { select: { name: true } } },
  })
  if (!section) throw notFound('Section')

  if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    const allowed = await learnerSectionIds(actor)
    if (!allowed.includes(sectionId)) {
      throw forbidden('You can only view your own section timetable')
    }
  }

  const rows = (
    await prisma.timetableSlot.findMany({
      where: { sectionId },
      select: SLOT_SELECT,
      orderBy: [{ startTime: 'asc' }],
    })
  ).map(toRow)

  return {
    scope: {
      kind: 'section',
      sectionId: section.id,
      sectionName: section.name,
      className: section.class.name,
    },
    days: DAYS,
    periods: periodsOf(rows),
    slots: rows,
  }
}

// ─────────────────────────────────────────────────────────────
//  teacher timetable
// ─────────────────────────────────────────────────────────────

export async function getTeacherTimetable(actor: Actor, teacherId?: string): Promise<TimetableGrid> {
  let targetId = teacherId

  if (actor.role === 'TEACHER') {
    const own = await teacherIdOf(actor.id)
    if (!own) throw notFound('Teacher profile')
    if (targetId && targetId !== own) throw forbidden('You can only view your own timetable')
    targetId = own
  } else if (!targetId) {
    throw badRequest('teacherId is required')
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: targetId },
    select: { id: true, user: { select: { name: true } }, department: true },
  })
  if (!teacher) throw notFound('Teacher')

  const rows = (
    await prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id },
      select: SLOT_SELECT,
      orderBy: [{ startTime: 'asc' }],
    })
  ).map(toRow)

  return {
    scope: { kind: 'teacher', teacherId: teacher.id, teacherName: teacher.user.name },
    days: DAYS,
    periods: periodsOf(rows),
    slots: rows,
  }
}

// ─────────────────────────────────────────────────────────────
//  "my timetable" convenience for learners
// ─────────────────────────────────────────────────────────────

export async function getMyTimetable(actor: Actor): Promise<TimetableGrid | null> {
  if (actor.role === 'TEACHER') return getTeacherTimetable(actor)

  if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    const sections = await learnerSectionIds(actor)
    if (sections.length === 0) return null

    // merge every section the learner sits in (usually one)
    const grids = await Promise.all(sections.map((id) => getSectionTimetable(actor, id)))
    if (grids.length === 1) return grids[0]!

    const slots = grids.flatMap((g) => g.slots)
    return {
      scope: { kind: 'section', sectionId: sections[0]!, sectionName: null, className: grids[0]?.scope.className },
      days: DAYS,
      periods: periodsOf(slots),
      slots,
    }
  }

  return null
}

// ─────────────────────────────────────────────────────────────
//  create / update / delete (ADMIN)
// ─────────────────────────────────────────────────────────────

export interface CreateSlotInput {
  classId: string
  sectionId?: string | null
  subjectId: string
  teacherId?: string | null
  dayOfWeek: DayOfWeekValue
  startTime: string
  endTime: string
  roomNo?: string | null
}

function minutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export async function createSlot(actor: Actor, input: CreateSlotInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can edit the timetable')

  if (minutes(input.endTime) <= minutes(input.startTime)) {
    throw badRequest('End time must be after the start time')
  }

  const [cls, subject] = await prisma.$transaction([
    prisma.class.findUnique({ where: { id: input.classId }, select: { id: true } }),
    prisma.subject.findUnique({ where: { id: input.subjectId }, select: { id: true, classId: true } }),
  ])
  if (!cls) throw badRequest('Class not found')
  if (!subject) throw badRequest('Subject not found')
  if (subject.classId !== input.classId) throw badRequest('That subject does not belong to this class')

  // one subject per section per slot
  const clash = await prisma.timetableSlot.findFirst({
    where: {
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      OR: [{ classId: input.classId, sectionId: input.sectionId ?? null }],
    },
    select: { id: true, subject: { select: { name: true } } },
  })
  if (clash) {
    throw conflict(`This slot is already taken by ${clash.subject.name} — edit that slot instead`)
  }

  // a teacher cannot be in two places at once
  if (input.teacherId) {
    const busy = await prisma.timetableSlot.findFirst({
      where: { teacherId: input.teacherId, dayOfWeek: input.dayOfWeek, startTime: input.startTime },
      select: { id: true, class: { select: { name: true } }, section: { select: { name: true } } },
    })
    if (busy) {
      throw conflict(
        `This teacher is already booked at ${input.startTime} (${busy.class.name} ${
          busy.section?.name ?? ''
        })`.trim(),
      )
    }
  }

  const slot = await prisma.timetableSlot.create({
    data: {
      classId: input.classId,
      sectionId: input.sectionId ?? null,
      subjectId: input.subjectId,
      teacherId: input.teacherId ?? null,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      roomNo: input.roomNo ?? null,
    },
    select: { id: true },
  })

  return { id: slot.id }
}

export async function updateSlot(actor: Actor, id: string, input: Partial<CreateSlotInput>) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can edit the timetable')

  const existing = await prisma.timetableSlot.findUnique({
    where: { id },
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true, classId: true, sectionId: true },
  })
  if (!existing) throw notFound('Timetable slot')

  const start = input.startTime ?? existing.startTime
  const end = input.endTime ?? existing.endTime
  if (minutes(end) <= minutes(start)) throw badRequest('End time must be after the start time')

  const day = input.dayOfWeek ?? (existing.dayOfWeek as DayOfWeekValue)
  const sectionId = input.sectionId !== undefined ? input.sectionId : existing.sectionId

  const clash = await prisma.timetableSlot.findFirst({
    where: {
      id: { not: id },
      dayOfWeek: day,
      startTime: start,
      classId: input.classId ?? existing.classId,
      sectionId: sectionId ?? null,
    },
    select: { id: true },
  })
  if (clash) throw conflict('Another subject already occupies this slot')

  if (input.teacherId) {
    const busy = await prisma.timetableSlot.findFirst({
      where: { id: { not: id }, teacherId: input.teacherId, dayOfWeek: day, startTime: start },
      select: { id: true },
    })
    if (busy) throw conflict('This teacher is already booked at that time')
  }

  await prisma.timetableSlot.update({
    where: { id },
    data: {
      ...(input.classId !== undefined ? { classId: input.classId } : {}),
      ...(input.sectionId !== undefined ? { sectionId: input.sectionId } : {}),
      ...(input.subjectId !== undefined ? { subjectId: input.subjectId } : {}),
      ...(input.teacherId !== undefined ? { teacherId: input.teacherId } : {}),
      ...(input.dayOfWeek !== undefined ? { dayOfWeek: input.dayOfWeek } : {}),
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
      ...(input.roomNo !== undefined ? { roomNo: input.roomNo } : {}),
    },
  })

  return { id }
}

export async function deleteSlot(actor: Actor, id: string) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can edit the timetable')
  const slot = await prisma.timetableSlot.findUnique({ where: { id }, select: { id: true } })
  if (!slot) throw notFound('Timetable slot')
  await prisma.timetableSlot.delete({ where: { id } })
  return { deleted: true }
}

// ─────────────────────────────────────────────────────────────
//  helpers for the editor UI
// ─────────────────────────────────────────────────────────────

/** Classes + sections + subjects + teachers in one payload for the editor. */
export async function getTimetableOptions(actor: Actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can load timetable options')
  }

  const [classes, subjects, teachers] = await prisma.$transaction([
    prisma.class.findMany({
      orderBy: { level: 'desc' },
      select: {
        id: true,
        name: true,
        level: true,
        sections: { orderBy: { name: 'asc' }, select: { id: true, name: true } },
      },
    }),
    prisma.subject.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, classId: true } }),
    prisma.teacher.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { user: { name: 'asc' } },
      select: { id: true, user: { select: { name: true } }, department: true },
    }),
  ])

  return {
    classes: classes.map((c) => ({ id: c.id, name: c.name, level: c.level, sections: c.sections })),
    subjects,
    teachers: teachers.map((t) => ({ id: t.id, name: t.user.name, department: t.department })),
  }
}

/** Today's classes for the signed-in learner/teacher — dashboard widget. */
export async function getUpcomingClasses(actor: Actor) {
  const jsDay = new Date().getUTCDay() // 0 = Sunday
  const today: DayOfWeekValue = DAYS[(jsDay + 6) % 7] ?? 'MONDAY'

  const base: Prisma.TimetableSlotWhereInput = { dayOfWeek: today }

  if (actor.role === 'TEACHER') {
    const id = await teacherIdOf(actor.id)
    if (!id) return { day: today, classes: [] }
    base.teacherId = id
  } else if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    const sections = await learnerSectionIds(actor)
    if (sections.length === 0) return { day: today, classes: [] }
    base.sectionId = { in: sections }
  } else {
    return { day: today, classes: [] }
  }

  const rows = (
    await prisma.timetableSlot.findMany({
      where: base,
      select: SLOT_SELECT,
      orderBy: { startTime: 'asc' },
    })
  ).map(toRow)

  return { day: today, classes: rows }
}
