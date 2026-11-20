import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, forbidden, notFound } from '../utils/errors.js'
import type { PaginationQuery } from '../utils/pagination.js'
import { buildMeta, type PaginationMeta } from '../utils/response.js'

/**
 * Exams & results module.
 *
 * Access rules:
 *   ADMIN    — schedule exams, publish results, see everything
 *   TEACHER  — see exams for sections they teach; enter marks for those exams
 *   STUDENT  — see exams + their own published results
 *   PARENT   — their children's published results
 */

export interface Actor {
  id: string
  role: Role
}

export type ExamTypeValue = 'QUIZ' | 'UNIT_TEST' | 'MIDTERM' | 'FINAL' | 'PRACTICAL' | 'PROJECT'
export type ExamStatusValue = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'PUBLISHED'

function dayStart(input: string | Date): Date {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) throw badRequest('Invalid date')
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Grade from a percentage, following the common Pakistan board scale. */
export function gradeFor(percent: number): string {
  if (percent >= 90) return 'A+'
  if (percent >= 80) return 'A'
  if (percent >= 70) return 'B'
  if (percent >= 60) return 'C'
  if (percent >= 50) return 'D'
  if (percent >= 40) return 'E'
  return 'F'
}

async function teacherContext(userId: string) {
  const teacher = await prisma.teacher.findUnique({
    where: { userId },
    select: { id: true },
  })
  if (!teacher) return { teacherId: null as string | null, sectionIds: [] as string[], subjectIds: [] as string[] }

  const [slots, assignments] = await prisma.$transaction([
    prisma.timetableSlot.findMany({
      where: { teacherId: teacher.id, sectionId: { not: null } },
      select: { sectionId: true, subjectId: true },
    }),
    prisma.subjectAssignment.findMany({
      where: { teacherId: teacher.id },
      select: { sectionId: true, subjectId: true },
    }),
  ])

  return {
    teacherId: teacher.id,
    sectionIds: [...new Set([...slots.map((s) => s.sectionId), ...assignments.map((a) => a.sectionId)])].filter(
      (s): s is string => !!s,
    ),
    subjectIds: [...new Set([...slots.map((s) => s.subjectId), ...assignments.map((a) => a.subjectId)])],
  }
}

// ─────────────────────────────────────────────────────────────
//  exams
// ─────────────────────────────────────────────────────────────

export interface ExamFilters extends PaginationQuery {
  classId?: string
  sectionId?: string
  subjectId?: string
  status?: ExamStatusValue
  type?: ExamTypeValue
  from?: string
  to?: string
}

export interface ExamRow {
  id: string
  name: string
  type: ExamTypeValue
  status: ExamStatusValue
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

export async function listExams(
  actor: Actor,
  filters: ExamFilters,
): Promise<{ items: ExamRow[]; meta: PaginationMeta }> {
  const ctx = actor.role === 'TEACHER' ? await teacherContext(actor.id) : null

  const where: Prisma.ExamWhereInput = {
    ...(filters.classId ? { classId: filters.classId } : {}),
    ...(filters.sectionId ? { sectionId: filters.sectionId } : {}),
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.from || filters.to
      ? {
          examDate: {
            ...(filters.from ? { gte: dayStart(filters.from) } : {}),
            ...(filters.to ? { lte: dayStart(filters.to) } : {}),
          },
        }
      : {}),
  }

  // ── role scoping ──────────────────────────────────────────
  if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    // learners only see exams that already have results (published or not yet)
    const studentFilter =
      actor.role === 'STUDENT'
        ? { userId: actor.id }
        : { guardians: { some: { parent: { userId: actor.id } } } }

    where.results = { some: { student: studentFilter } }
  } else if (actor.role === 'TEACHER' && ctx) {
    // teacher sees exams on their sections or in their subjects
    where.OR = [
      { sectionId: { in: ctx.sectionIds } },
      { subjectId: { in: ctx.subjectIds } },
      { createdById: ctx.teacherId ?? '__none__' },
    ]
  }

  if (filters.search) {
    const search = {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' as const } },
        { subject: { name: { contains: filters.search, mode: 'insensitive' as const } } },
      ],
    }
    where.AND = [search]
  }

  const [rows, total] = await prisma.$transaction([
    prisma.exam.findMany({
      where,
      orderBy: [{ examDate: 'desc' }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        examDate: true,
        startTime: true,
        durationMin: true,
        totalMarks: true,
        passingMarks: true,
        classId: true,
        sectionId: true,
        subjectId: true,
        createdById: true,
        class: { select: { name: true } },
        section: { select: { name: true } },
        subject: { select: { name: true } },
        results: { select: { marksObtained: true } },
      },
    }),
    prisma.exam.count({ where }),
  ])

  const items: ExamRow[] = rows.map((e) => {
    const count = e.results.length
    const totalMarks = e.totalMarks
    const avgPercent =
      count === 0
        ? null
        : Math.round(
            (e.results.reduce((sum, r) => sum + Number(r.marksObtained), 0) / count / totalMarks) * 1000,
          ) / 10

    const teachesThis =
      actor.role === 'ADMIN' ||
      (ctx !== null &&
        ((e.sectionId !== null && ctx.sectionIds.includes(e.sectionId)) ||
          ctx.subjectIds.includes(e.subjectId) ||
          e.createdById === ctx.teacherId))

    return {
      id: e.id,
      name: e.name,
      type: e.type as ExamTypeValue,
      status: e.status as ExamStatusValue,
      examDate: isoDay(e.examDate),
      startTime: e.startTime,
      durationMin: e.durationMin,
      totalMarks: totalMarks,
      passingMarks: e.passingMarks,
      classId: e.classId,
      className: e.class.name,
      sectionId: e.sectionId,
      sectionName: e.section?.name ?? null,
      subjectId: e.subjectId,
      subjectName: e.subject.name,
      resultCount: count,
      averagePercent: avgPercent,
      canEnterMarks: teachesThis && e.status !== 'PUBLISHED',
      canPublish: actor.role === 'ADMIN' && count > 0,
    }
  })

  return { items, meta: buildMeta(filters.page, filters.limit, total) }
}

export async function getExam(_actor: Actor, id: string) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      examDate: true,
      startTime: true,
      durationMin: true,
      totalMarks: true,
      passingMarks: true,
      classId: true,
      sectionId: true,
      subjectId: true,
      class: { select: { name: true } },
      section: { select: { name: true } },
      subject: { select: { name: true } },
      _count: { select: { results: true } },
    },
  })
  if (!exam) throw notFound('Exam')

  return {
    id: exam.id,
    name: exam.name,
    type: exam.type,
    status: exam.status,
    examDate: isoDay(exam.examDate),
    startTime: exam.startTime,
    durationMin: exam.durationMin,
    totalMarks: exam.totalMarks,
    passingMarks: exam.passingMarks,
    classId: exam.classId,
    className: exam.class.name,
    sectionId: exam.sectionId,
    sectionName: exam.section?.name ?? null,
    subjectId: exam.subjectId,
    subjectName: exam.subject.name,
    resultCount: exam._count.results,
  }
}

export interface CreateExamInput {
  name: string
  type: ExamTypeValue
  examDate: string
  startTime?: string | null
  durationMin?: number
  totalMarks?: number
  passingMarks?: number
  classId: string
  sectionId?: string | null
  subjectId: string
}

export async function createExam(actor: Actor, input: CreateExamInput) {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can schedule exams')
  }

  const [cls, subject] = await prisma.$transaction([
    prisma.class.findUnique({ where: { id: input.classId }, select: { id: true } }),
    prisma.subject.findUnique({ where: { id: input.subjectId }, select: { id: true } }),
  ])
  if (!cls) throw badRequest('Class not found')
  if (!subject) throw badRequest('Subject not found')

  if (input.passingMarks && input.totalMarks && input.passingMarks > input.totalMarks) {
    throw badRequest('Passing marks cannot exceed total marks')
  }

  const ctx = actor.role === 'TEACHER' ? await teacherContext(actor.id) : null
  if (actor.role === 'TEACHER' && ctx) {
    const allowed =
      (input.sectionId && ctx.sectionIds.includes(input.sectionId)) || ctx.subjectIds.includes(input.subjectId)
    if (!allowed) throw forbidden('You can only schedule exams for your own subjects or sections')
  }

  const exam = await prisma.exam.create({
    data: {
      name: input.name.trim(),
      type: input.type,
      examDate: dayStart(input.examDate),
      startTime: input.startTime ?? null,
      durationMin: input.durationMin ?? 120,
      totalMarks: input.totalMarks ?? 100,
      passingMarks: input.passingMarks ?? 40,
      classId: input.classId,
      sectionId: input.sectionId ?? null,
      subjectId: input.subjectId,
      createdById: ctx?.teacherId ?? null,
      status: 'SCHEDULED',
    },
    select: { id: true, name: true, examDate: true },
  })

  return { id: exam.id, name: exam.name, examDate: isoDay(exam.examDate) }
}

export async function updateExamStatus(actor: Actor, id: string, status: ExamStatusValue) {
  const exam = await prisma.exam.findUnique({
    where: { id },
    select: { id: true, _count: { select: { results: true } } },
  })
  if (!exam) throw notFound('Exam')

  if (status === 'PUBLISHED') {
    if (actor.role !== 'ADMIN') throw forbidden('Only administrators can publish results')
    if (exam._count.results === 0) throw badRequest('Enter at least one result before publishing')
  } else if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can change exam status')
  }

  await prisma.exam.update({ where: { id }, data: { status } })
  return { id, status }
}

export async function deleteExam(actor: Actor, id: string) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can delete exams')
  const exam = await prisma.exam.findUnique({ where: { id }, select: { id: true } })
  if (!exam) throw notFound('Exam')
  await prisma.exam.delete({ where: { id } })
  return { deleted: true }
}

// ─────────────────────────────────────────────────────────────
//  marks entry
// ─────────────────────────────────────────────────────────────

export interface MarksRosterEntry {
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
    status: ExamStatusValue
    examDate: string
  }
  entries: MarksRosterEntry[]
  stats: { entered: number; absent: number; total: number; average: number | null }
  canEdit: boolean
}

export async function getMarksRoster(actor: Actor, examId: string): Promise<MarksRoster> {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can enter marks')
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      name: true,
      sectionId: true,
      subjectId: true,
      classId: true,
      totalMarks: true,
      passingMarks: true,
      status: true,
      examDate: true,
      class: { select: { name: true } },
      section: { select: { name: true } },
      subject: { select: { name: true } },
      results: { select: { id: true, studentId: true, marksObtained: true, grade: true, remarks: true } },
    },
  })
  if (!exam) throw notFound('Exam')

  let canEdit = actor.role === 'ADMIN'
  if (actor.role === 'TEACHER') {
    const ctx = await teacherContext(actor.id)
    canEdit =
      (exam.sectionId !== null && ctx.sectionIds.includes(exam.sectionId)) || ctx.subjectIds.includes(exam.subjectId)
  }
  if (!canEdit) throw forbidden('You can only enter marks for exams you teach')

  // roster: the exam's section, or every active student in the class
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: 'ACTIVE',
      ...(exam.sectionId ? { sectionId: exam.sectionId } : { classId: exam.classId }),
    },
    select: {
      rollNo: true,
      student: {
        select: { id: true, admissionNo: true, rollNo: true, user: { select: { name: true } } },
      },
    },
  })

  const byStudent = new Map(exam.results.map((r) => [r.studentId, r]))

  const entries: MarksRosterEntry[] = enrollments
    .map((e) => {
      const result = byStudent.get(e.student.id)
      return {
        studentId: e.student.id,
        name: e.student.user.name,
        admissionNo: e.student.admissionNo,
        rollNo: e.rollNo ?? e.student.rollNo,
        marksObtained: result ? Number(result.marksObtained) : null,
        grade: result?.grade ?? null,
        remarks: result?.remarks ?? null,
        resultId: result?.id ?? null,
      }
    })
    .sort((a, b) => (a.rollNo ?? '').localeCompare(b.rollNo ?? '', undefined, { numeric: true }))

  const marked = entries.filter((e) => e.marksObtained !== null)
  const average =
    marked.length === 0
      ? null
      : Math.round((marked.reduce((s, e) => s + (e.marksObtained ?? 0), 0) / marked.length / exam.totalMarks) * 1000) / 10

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      subjectName: exam.subject.name,
      className: exam.class.name,
      sectionName: exam.section?.name ?? null,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
      status: exam.status as ExamStatusValue,
      examDate: isoDay(exam.examDate),
    },
    entries,
    stats: { entered: marked.length, absent: entries.length - marked.length, total: entries.length, average },
    canEdit: exam.status !== 'PUBLISHED',
  }
}

export interface SaveMarksInput {
  entries: { studentId: string; marksObtained: number | null; remarks?: string | null }[]
}

export async function saveMarks(actor: Actor, examId: string, input: SaveMarksInput) {
  const roster = await getMarksRoster(actor, examId)
  if (roster.exam.status === 'PUBLISHED') {
    throw badRequest('Results are already published — unpublish before editing marks')
  }
  if (input.entries.length === 0) throw badRequest('No marks supplied')

  const totalMarks = roster.exam.totalMarks
  for (const e of input.entries) {
    if (e.marksObtained !== null) {
      if (!Number.isFinite(e.marksObtained) || e.marksObtained < 0) {
        throw badRequest('Marks cannot be negative')
      }
      if (e.marksObtained > totalMarks) {
        throw badRequest(`Marks cannot exceed the total of ${totalMarks}`)
      }
    }
  }

  const validStudents = new Set(roster.entries.map((e) => e.studentId))
  const stray = input.entries.filter((e) => !validStudents.has(e.studentId))
  if (stray.length > 0) throw badRequest(`${stray.length} student(s) are not in this exam's roster`)

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { subjectId: true },
  })
  if (!exam) throw notFound('Exam')

  let created = 0
  let removed = 0

  await prisma.$transaction(async (tx) => {
    for (const entry of input.entries) {
      if (entry.marksObtained === null) {
        const del = await tx.examResult.deleteMany({ where: { examId, studentId: entry.studentId } })
        removed += del.count
        continue
      }

      const percent = (entry.marksObtained / totalMarks) * 100
      const grade = gradeFor(percent)

      await tx.examResult.upsert({
        where: { examId_studentId: { examId, studentId: entry.studentId } },
        create: {
          examId,
          studentId: entry.studentId,
          subjectId: exam.subjectId,
          marksObtained: new Prisma.Decimal(entry.marksObtained),
          grade,
          remarks: entry.remarks ?? null,
          enteredById: actor.id,
        },
        update: {
          marksObtained: new Prisma.Decimal(entry.marksObtained),
          grade,
          remarks: entry.remarks ?? null,
          enteredById: actor.id,
        },
      })
      created += 1
    }
  })

  const refreshed = await getMarksRoster(actor, examId)
  return { saved: created, removed, stats: refreshed.stats }
}

// ─────────────────────────────────────────────────────────────
//  results — student / parent transcript
// ─────────────────────────────────────────────────────────────

export interface ResultFilters extends PaginationQuery {
  studentId?: string
  examId?: string
  subjectId?: string
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

export async function listResults(
  actor: Actor,
  filters: ResultFilters,
): Promise<{ items: ResultRow[]; meta: PaginationMeta }> {
  const where: Prisma.ExamResultWhereInput = {
    ...(filters.examId ? { examId: filters.examId } : {}),
    ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
  }

  if (actor.role === 'STUDENT') {
    where.student = { userId: actor.id }
    // only published exams
    where.exam = { status: 'PUBLISHED' }
  } else if (actor.role === 'PARENT') {
    where.student = { guardians: { some: { parent: { userId: actor.id } } } }
    where.exam = { status: 'PUBLISHED' }
  } else if (actor.role === 'TEACHER') {
    const ctx = await teacherContext(actor.id)
    where.OR = [
      { exam: { sectionId: { in: ctx.sectionIds } } },
      { exam: { subjectId: { in: ctx.subjectIds } } },
    ]
  }

  if (filters.studentId) {
    if (actor.role === 'ADMIN' || actor.role === 'TEACHER') where.studentId = filters.studentId
  }

  if (filters.search) {
    const search = {
      OR: [
        { student: { user: { name: { contains: filters.search, mode: 'insensitive' as const } } } },
        { exam: { name: { contains: filters.search, mode: 'insensitive' as const } } },
        { subject: { name: { contains: filters.search, mode: 'insensitive' as const } } },
      ],
    }
    where.AND = [search]
  }

  const [rows, total] = await prisma.$transaction([
    prisma.examResult.findMany({
      where,
      orderBy: [{ exam: { examDate: 'desc' } }, { subject: { name: 'asc' } }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        marksObtained: true,
        grade: true,
        remarks: true,
        studentId: true,
        exam: {
          select: {
            id: true,
            name: true,
            type: true,
            examDate: true,
            totalMarks: true,
            passingMarks: true,
            status: true,
          },
        },
        subject: { select: { name: true } },
        student: { select: { admissionNo: true, user: { select: { name: true } } } },
      },
    }),
    prisma.examResult.count({ where }),
  ])

  const items: ResultRow[] = rows.map((r) => {
    const obtained = Number(r.marksObtained)
    const totalMarks = r.exam.totalMarks
    return {
      id: r.id,
      examId: r.exam.id,
      examName: r.exam.name,
      examType: r.exam.type,
      examDate: isoDay(r.exam.examDate),
      subjectName: r.subject.name,
      studentId: r.studentId,
      studentName: r.student.user.name,
      admissionNo: r.student.admissionNo,
      marksObtained: obtained,
      totalMarks,
      percent: Math.round((obtained / totalMarks) * 1000) / 10,
      grade: r.grade,
      passed: obtained >= r.exam.passingMarks,
      remarks: r.remarks,
    }
  })

  return { items, meta: buildMeta(filters.page, filters.limit, total) }
}

/** Transcript grouped by exam — the report-card view. */
export async function getTranscript(
  actor: Actor,
  params: { studentId?: string; studentUserId?: string },
) {
  let studentId = params.studentId

  if (actor.role === 'STUDENT') {
    const own = await prisma.student.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!own) throw notFound('Student')
    studentId = own.id
  } else if (actor.role === 'PARENT') {
    const child = await prisma.student.findFirst({
      where: {
        guardians: { some: { parent: { userId: actor.id } } },
        ...(studentId ? { id: studentId } : {}),
      },
      select: { id: true },
    })
    if (!child) throw notFound('Student')
    studentId = child.id
  }

  if (!studentId) throw badRequest('studentId is required')

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      admissionNo: true,
      rollNo: true,
      user: { select: { name: true } },
      class: { select: { name: true } },
      enrollments: { where: { status: 'ACTIVE' }, take: 1, select: { rollNo: true, section: { select: { name: true } } } },
    },
  })
  if (!student) throw notFound('Student')

  const results = await prisma.examResult.findMany({
    where: { studentId, exam: { status: 'PUBLISHED' } },
    orderBy: [{ exam: { examDate: 'asc' } }, { subject: { name: 'asc' } }],
    select: {
      marksObtained: true,
      grade: true,
      exam: { select: { id: true, name: true, type: true, examDate: true, totalMarks: true, passingMarks: true } },
      subject: { select: { name: true } },
    },
  })

  const exams = new Map<
    string,
    {
      examId: string
      examName: string
      examType: string
      examDate: string
      totalMarks: number
      subjects: { subject: string; marks: number; total: number; percent: number; grade: string | null; passed: boolean }[]
      obtained: number
      total: number
      percent: number
      grade: string
      passed: boolean
    }
  >()

  for (const r of results) {
    const key = r.exam.id
    const entry =
      exams.get(key) ??
      {
        examId: r.exam.id,
        examName: r.exam.name,
        examType: r.exam.type,
        examDate: isoDay(r.exam.examDate),
        totalMarks: r.exam.totalMarks,
        subjects: [],
        obtained: 0,
        total: 0,
        percent: 0,
        grade: 'F',
        passed: true,
      }

    const marks = Number(r.marksObtained)
    entry.subjects.push({
      subject: r.subject.name,
      marks,
      total: r.exam.totalMarks,
      percent: Math.round((marks / r.exam.totalMarks) * 1000) / 10,
      grade: r.grade,
      passed: marks >= r.exam.passingMarks,
    })
    entry.obtained += marks
    entry.total += r.exam.totalMarks
    entry.passed = entry.passed && marks >= r.exam.passingMarks
    exams.set(key, entry)
  }

  const rows = [...exams.values()].map((e) => {
    const percent = e.total === 0 ? 0 : Math.round((e.obtained / e.total) * 1000) / 10
    return { ...e, percent, grade: gradeFor(percent) }
  })

  return {
    student: {
      id: student.id,
      name: student.user.name,
      admissionNo: student.admissionNo,
      rollNo: student.enrollments[0]?.rollNo ?? student.rollNo,
      className: student.class?.name ?? '—',
      sectionName: student.enrollments[0]?.section?.name ?? null,
    },
    exams: rows,
    overall:
      rows.length === 0
        ? null
        : {
            obtained: rows.reduce((s, r) => s + r.obtained, 0),
            total: rows.reduce((s, r) => s + r.total, 0),
            percent:
              Math.round(
                (rows.reduce((s, r) => s + r.obtained, 0) / rows.reduce((s, r) => s + r.total, 0)) * 1000,
              ) / 10,
          },
  }
}

/** Class-wide performance for one exam — distribution + toppers. */
export async function getExamAnalysis(actor: Actor, examId: string) {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can view exam analysis')
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: {
      id: true,
      name: true,
      totalMarks: true,
      passingMarks: true,
      class: { select: { name: true } },
      subject: { select: { name: true } },
      results: {
        select: {
          marksObtained: true,
          grade: true,
          student: { select: { admissionNo: true, user: { select: { name: true } } } },
        },
      },
    },
  })
  if (!exam) throw notFound('Exam')

  const rows = exam.results.map((r) => ({
    name: r.student.user.name,
    admissionNo: r.student.admissionNo,
    marks: Number(r.marksObtained),
    percent: Math.round((Number(r.marksObtained) / exam.totalMarks) * 1000) / 10,
    grade: r.grade,
    passed: Number(r.marksObtained) >= exam.passingMarks,
  }))

  const bands = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 }
  for (const r of rows) {
    const g = gradeFor(r.percent) as keyof typeof bands
    bands[g] += 1
  }

  const marks = rows.map((r) => r.marks)
  const average = marks.length === 0 ? null : Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 100) / 100
  const highest = marks.length === 0 ? null : Math.max(...marks)
  const lowest = marks.length === 0 ? null : Math.min(...marks)
  const passed = rows.filter((r) => r.passed).length

  return {
    exam: {
      id: exam.id,
      name: exam.name,
      className: exam.class.name,
      subjectName: exam.subject.name,
      totalMarks: exam.totalMarks,
      passingMarks: exam.passingMarks,
    },
    count: rows.length,
    average,
    highest,
    lowest,
    passCount: passed,
    failCount: rows.length - passed,
    passRate: rows.length === 0 ? null : Math.round((passed / rows.length) * 1000) / 10,
    bands,
    toppers: [...rows].sort((a, b) => b.marks - a.marks).slice(0, 5),
  }
}
