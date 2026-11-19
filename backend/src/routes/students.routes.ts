import { Router } from 'express'
import type { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../utils/response.js'
import { badRequest } from '../utils/errors.js'
import * as students from '../services/students.service.js'
import {
  createStudentSchema,
  deleteQuery,
  studentIdParam,
  studentListQuery,
  updateStudentSchema,
} from '../validators/students.validator.js'
import type { Role } from '@prisma/client'

export const studentsRouter = Router()

const actorOf = (req: Parameters<typeof students.listStudents>[0] extends never ? never : { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

// ─────────────────────────────────────────────────────────────
//  GET /students  — paginated, filtered, scoped by role
// ─────────────────────────────────────────────────────────────
studentsRouter.get(
  '/students',
  authenticate,
  validate({ query: studentListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof studentListQuery>
    const { items, meta } = await students.listStudents(actorOf(req), filters)
    ok(res, items, meta)
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /students/export.csv
// ─────────────────────────────────────────────────────────────
studentsRouter.get(
  '/students/export.csv',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ query: studentListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof studentListQuery>
    const csv = await students.exportStudentsCsv(actorOf(req), filters)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="students-${Date.now()}.csv"`)
    res.send(csv)
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /students/:id
// ─────────────────────────────────────────────────────────────
studentsRouter.get(
  '/students/:id',
  authenticate,
  validate({ params: studentIdParam }),
  asyncHandler(async (req, res) => {
    const student = await students.getStudent(actorOf(req), String(req.params['id']))
    ok(res, student)
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /students   (ADMIN)
// ─────────────────────────────────────────────────────────────
studentsRouter.post(
  '/students',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createStudentSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createStudentSchema>

    if (body.sectionId && !body.classId) throw badRequest('classId is required when sectionId is given')

    // zod inferred Date for dates; the service expects ISO strings.
    const result = await students.createStudent(actorOf(req), {
      ...body,
      dateOfBirth: body.dateOfBirth.toISOString(),
      admissionDate: body.admissionDate?.toISOString(),
    })

    created(res, result)
  }),
)

// ─────────────────────────────────────────────────────────────
//  PATCH /students/:id   (ADMIN)
// ─────────────────────────────────────────────────────────────
studentsRouter.patch(
  '/students/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: studentIdParam, body: updateStudentSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateStudentSchema>
    const { dateOfBirth, ...rest } = body
    const updated = await students.updateStudent(actorOf(req), String(req.params['id']), {
      ...rest,
      ...(dateOfBirth ? { dateOfBirth: dateOfBirth.toISOString() } : {}),
    })
    ok(res, updated)
  }),
)

// ─────────────────────────────────────────────────────────────
//  DELETE /students/:id  — withdraw by default, ?hard=true to purge
// ─────────────────────────────────────────────────────────────
studentsRouter.delete(
  '/students/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: studentIdParam, query: deleteQuery }),
  asyncHandler(async (req, res) => {
    const hard = (req.query as { hard?: boolean }).hard === true
    const result = await students.deleteStudent(actorOf(req), String(req.params['id']), hard)
    ok(res, result)
  }),
)
