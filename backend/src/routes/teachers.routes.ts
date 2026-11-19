import { Router } from 'express'
import type { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../utils/response.js'
import * as teachers from '../services/teachers.service.js'
import {
  createTeacherSchema,
  teacherIdParam,
  teacherListQuery,
  updateTeacherSchema,
} from '../validators/teachers.validator.js'
import type { Role } from '@prisma/client'

export const teachersRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

// ─────────────────────────────────────────────────────────────
//  GET /teachers — every role may read the directory (scoped fields)
// ─────────────────────────────────────────────────────────────
teachersRouter.get(
  '/teachers',
  authenticate,
  validate({ query: teacherListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof teacherListQuery>
    const { items, meta } = await teachers.listTeachers(actorOf(req), filters)
    ok(res, items, meta)
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /teachers/filters — departments, designations, subjects for the UI
// ─────────────────────────────────────────────────────────────
teachersRouter.get(
  '/teachers/filters',
  authenticate,
  asyncHandler(async (_req, res) => {
    ok(res, await teachers.getTeacherFilters())
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /teachers/export.csv   (ADMIN)
// ─────────────────────────────────────────────────────────────
teachersRouter.get(
  '/teachers/export.csv',
  authenticate,
  authorize('ADMIN'),
  validate({ query: teacherListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof teacherListQuery>
    const csv = await teachers.exportTeachersCsv(actorOf(req), filters)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="teachers-${Date.now()}.csv"`)
    res.send(csv)
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /teachers/:id
// ─────────────────────────────────────────────────────────────
teachersRouter.get(
  '/teachers/:id',
  authenticate,
  validate({ params: teacherIdParam }),
  asyncHandler(async (req, res) => {
    ok(res, await teachers.getTeacher(actorOf(req), String(req.params['id'])))
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /teachers   (ADMIN)
// ─────────────────────────────────────────────────────────────
teachersRouter.post(
  '/teachers',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createTeacherSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createTeacherSchema>
    const result = await teachers.createTeacher(actorOf(req), {
      ...body,
      joiningDate: body.joiningDate.toISOString(),
      dob: body.dob ? body.dob.toISOString() : null,
    })
    created(res, result)
  }),
)

// ─────────────────────────────────────────────────────────────
//  PATCH /teachers/:id   (ADMIN)
// ─────────────────────────────────────────────────────────────
teachersRouter.patch(
  '/teachers/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: teacherIdParam, body: updateTeacherSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateTeacherSchema>
    const { joiningDate, dob, ...rest } = body
    ok(
      res,
      await teachers.updateTeacher(actorOf(req), String(req.params['id']), {
        ...rest,
        ...(joiningDate ? { joiningDate: joiningDate.toISOString() } : {}),
        ...(dob !== undefined ? { dob: dob ? dob.toISOString() : null } : {}),
      }),
    )
  }),
)

// ─────────────────────────────────────────────────────────────
//  DELETE /teachers/:id  — terminate (soft) or ?hard=true to purge
// ─────────────────────────────────────────────────────────────
teachersRouter.delete(
  '/teachers/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: teacherIdParam }),
  asyncHandler(async (req, res) => {
    const hard = req.query['hard'] === 'true'
    ok(res, await teachers.deleteTeacher(actorOf(req), String(req.params['id']), hard))
  }),
)
