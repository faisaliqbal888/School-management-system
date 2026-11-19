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
