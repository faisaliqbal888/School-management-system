import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../config/prisma.js'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { paginationSchema, toOrderBy, toPrismaSkipTake } from '../utils/pagination.js'
import { buildMeta, created, ok } from '../utils/response.js'
import { conflict, notFound } from '../utils/errors.js'

export const academicRouter = Router()

// ═════════════════════════════════════════════════════════════
//  ACADEMIC YEARS
// ═════════════════════════════════════════════════════════════

const academicYearBody = z.object({
  name: z.string().trim().min(4).max(20), // "2025-2026"
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().default(false),
})

academicRouter.get(
  '/academic-years',
  authenticate,
  asyncHandler(async (_req, res) => {
    const years = await prisma.academicYear.findMany({ orderBy: { startDate: 'desc' } })
    ok(res, years)
  }),
)

academicRouter.post(
  '/academic-years',
  authenticate,
  authorize('ADMIN'),
  validate({ body: academicYearBody }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof academicYearBody>

    // Only one academic year can be current at a time.
    if (data.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      })
    }
    const year = await prisma.academicYear.create({ data })

    created(res, year)
  }),
)

// ═════════════════════════════════════════════════════════════
//  CLASSES
// ═════════════════════════════════════════════════════════════

const classQuery = paginationSchema.extend({
  academicYearId: z.string().optional(),
})

const classBody = z.object({
  name: z.string().trim().min(1).max(60),
  level: z.coerce.number().int().min(1).max(20),
  academicYearId: z.string().min(1),
  classTeacherId: z.string().nullish(),
  capacity: z.coerce.number().int().min(1).max(200).default(40),
})

academicRouter.get(
  '/classes',
  authenticate,
  validate({ query: classQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof classQuery>
    const where = q.academicYearId ? { academicYearId: q.academicYearId } : {}
    const { skip, take } = toPrismaSkipTake(q)

    const [items, total] = await prisma.$transaction([
      prisma.class.findMany({
        where,
        skip,
        take,
        orderBy: toOrderBy(q, ['name', 'level', 'createdAt'], 'level'),
        include: {
          academicYear: { select: { id: true, name: true } },
          _count: { select: { sections: true, students: true } },
        },
      }),
      prisma.class.count({ where }),
    ])

    ok(res, items, buildMeta(q.page, q.limit, total))
  }),
)

academicRouter.post(
  '/classes',
  authenticate,
  authorize('ADMIN'),
  validate({ body: classBody }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof classBody>
    const exists = await prisma.class.findFirst({
      where: { name: data.name, academicYearId: data.academicYearId },
    })
    if (exists) throw conflict(`Class "${data.name}" already exists in this academic year`)

    const cls = await prisma.class.create({ data })
    created(res, cls)
  }),
)

// ═════════════════════════════════════════════════════════════
//  SECTIONS
// ═════════════════════════════════════════════════════════════

const sectionBody = z.object({
  classId: z.string().min(1),
  name: z.string().trim().min(1).max(5), // "A"
  roomNo: z.string().trim().max(20).nullish(),
  capacity: z.coerce.number().int().min(1).max(200).default(40),
})

academicRouter.get(
  '/classes/:classId/sections',
  authenticate,
  asyncHandler(async (req, res) => {
    const classId = String(req.params['classId'])
    const sections = await prisma.section.findMany({
      where: { classId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { enrollments: true } } },
    })
    if (!sections.length) {
      const cls = await prisma.class.findUnique({ where: { id: classId } })
      if (!cls) throw notFound('Class')
    }
    ok(res, sections)
  }),
)

academicRouter.post(
  '/sections',
  authenticate,
  authorize('ADMIN'),
  validate({ body: sectionBody }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof sectionBody>
    const cls = await prisma.class.findUnique({ where: { id: data.classId } })
    if (!cls) throw notFound('Class')

    const exists = await prisma.section.findFirst({
      where: { classId: data.classId, name: data.name },
    })
    if (exists) throw conflict(`Section "${data.name}" already exists for this class`)

    created(res, await prisma.section.create({ data }))
  }),
)

// ═════════════════════════════════════════════════════════════
//  SUBJECTS
// ═════════════════════════════════════════════════════════════

const subjectBody = z.object({
  name: z.string().trim().min(1).max(80),
  code: z.string().trim().min(2).max(20).toUpperCase(),
  classId: z.string().min(1),
  isElective: z.boolean().default(false),
  creditHours: z.coerce.number().int().min(1).max(10).default(1),
})

academicRouter.get(
  '/subjects',
  authenticate,
  validate({ query: paginationSchema.extend({ classId: z.string().optional() }) }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof paginationSchema> & { classId?: string }
    const where = {
      ...(q.classId ? { classId: q.classId } : {}),
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' as const } } : {}),
    }
    const { skip, take } = toPrismaSkipTake(q)

    const [items, total] = await prisma.$transaction([
      prisma.subject.findMany({
        where,
        skip,
        take,
        orderBy: toOrderBy(q, ['name', 'code', 'createdAt'], 'name'),
        include: { class: { select: { id: true, name: true } } },
      }),
      prisma.subject.count({ where }),
    ])

    ok(res, items, buildMeta(q.page, q.limit, total))
  }),
)

academicRouter.post(
  '/subjects',
  authenticate,
  authorize('ADMIN'),
  validate({ body: subjectBody }),
  asyncHandler(async (req, res) => {
    const data = req.body as z.infer<typeof subjectBody>
    const dup = await prisma.subject.findUnique({ where: { code: data.code } })
    if (dup) throw conflict(`Subject code "${data.code}" is already in use`)

    created(res, await prisma.subject.create({ data }))
  }),
)

// ═════════════════════════════════════════════════════════════
//  MUTATIONS — edit & archive
//
//  Structural records are never hard-deleted while anything references them:
//  an enrolment, timetable slot or mark would lose its anchor. Deletes
//  therefore mean "archive" and report what is holding the row.
// ═════════════════════════════════════════════════════════════

const idParam = z.object({ id: z.string().min(1) })

// ── Academic year ────────────────────────────────────────────
academicRouter.patch(
  '/academic-years/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: academicYearBody.partial() }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const data = req.body as Partial<z.infer<typeof academicYearBody>>

    const existing = await prisma.academicYear.findUnique({ where: { id } })
    if (!existing) throw notFound('Academic year')

    if (data.isCurrent) {
      await prisma.academicYear.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } })
    }

    ok(res, await prisma.academicYear.update({ where: { id }, data }))
  }),
)

academicRouter.delete(
  '/academic-years/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const year = await prisma.academicYear.findUnique({
      where: { id },
      include: { _count: { select: { classes: true, enrollments: true } } },
    })
    if (!year) throw notFound('Academic year')
    if (year.isCurrent) throw conflict('This academic year is current — mark another year current first')
    if (year._count.classes > 0 || year._count.enrollments > 0) {
      throw conflict(
        `Year still has ${year._count.classes} class(es) and ${year._count.enrollments} enrolment(s)`,
      )
    }

    await prisma.academicYear.delete({ where: { id } })
    ok(res, { deleted: true, id })
  }),
)

// ── Class ────────────────────────────────────────────────────
academicRouter.patch(
  '/classes/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: classBody.partial() }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const data = req.body as Partial<z.infer<typeof classBody>>

    const existing = await prisma.class.findUnique({ where: { id } })
    if (!existing) throw notFound('Class')

    // Renaming within the same year must stay unique.
    if (data.name && data.name !== existing.name) {
      const dup = await prisma.class.findFirst({
        where: {
          name: data.name,
          academicYearId: data.academicYearId ?? existing.academicYearId,
          id: { not: id },
        },
      })
      if (dup) throw conflict(`Class "${data.name}" already exists in this academic year`)
    }

    if (data.classTeacherId) {
      const teacher = await prisma.teacher.findUnique({ where: { id: data.classTeacherId } })
      if (!teacher) throw notFound('Class teacher')
    }

    ok(res, await prisma.class.update({ where: { id }, data }))
  }),
)

academicRouter.delete(
  '/classes/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const cls = await prisma.class.findUnique({
      where: { id },
      include: { _count: { select: { sections: true, students: true, subjects: true, enrollments: true } } },
    })
    if (!cls) throw notFound('Class')

    const blockers = [
      cls._count.students > 0 && `${cls._count.students} student(s)`,
      cls._count.enrollments > 0 && `${cls._count.enrollments} enrolment(s)`,
      cls._count.sections > 0 && `${cls._count.sections} section(s)`,
      cls._count.subjects > 0 && `${cls._count.subjects} subject(s)`,
    ].filter(Boolean)

    if (blockers.length > 0) {
      throw conflict(`Cannot delete "${cls.name}" — it still has ${blockers.join(', ')}`)
    }

    await prisma.class.delete({ where: { id } })
    ok(res, { deleted: true, id })
  }),
)

// ── Section ──────────────────────────────────────────────────
academicRouter.patch(
  '/sections/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: sectionBody.partial() }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const existing = await prisma.section.findUnique({ where: { id } })
    if (!existing) throw notFound('Section')

    ok(res, await prisma.section.update({ where: { id }, data: req.body }))
  }),
)

academicRouter.delete(
  '/sections/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const section = await prisma.section.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true, timetable: true } } },
    })
    if (!section) throw notFound('Section')

    if (section._count.enrollments > 0 || section._count.timetable > 0) {
      throw conflict(
        `Section "${section.name}" still has ${section._count.enrollments} enrolment(s) and ` +
          `${section._count.timetable} timetable slot(s)`,
      )
    }

    await prisma.section.delete({ where: { id } })
    ok(res, { deleted: true, id })
  }),
)

// ── Subject ──────────────────────────────────────────────────
academicRouter.patch(
  '/subjects/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: subjectBody.partial() }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const data = req.body as Partial<z.infer<typeof subjectBody>>

    const existing = await prisma.subject.findUnique({ where: { id } })
    if (!existing) throw notFound('Subject')

    if (data.code && data.code !== existing.code) {
      const dup = await prisma.subject.findUnique({ where: { code: data.code } })
      if (dup) throw conflict(`Subject code "${data.code}" is already in use`)
    }

    ok(res, await prisma.subject.update({ where: { id }, data }))
  }),
)

academicRouter.delete(
  '/subjects/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const id = String(req.params['id'])
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: { _count: { select: { results: true, timetable: true } } },
    })
    if (!subject) throw notFound('Subject')

    if (subject._count.results > 0 || subject._count.timetable > 0) {
      throw conflict(
        `Subject "${subject.name}" has ${subject._count.results} result(s) and ` +
          `${subject._count.timetable} timetable slot(s) — mark it elective-off instead of deleting`,
      )
    }

    await prisma.subject.delete({ where: { id } })
    ok(res, { deleted: true, id })
  }),
)
