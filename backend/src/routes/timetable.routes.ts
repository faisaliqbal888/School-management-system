import { Router } from 'express'
import type { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created, noContent } from '../utils/response.js'
import * as timetable from '../services/timetable.service.js'
import {
  createSlotSchema,
  sectionParam,
  slotIdParam,
  teacherParam,
  updateSlotSchema,
} from '../validators/timetable.validator.js'
import type { Role } from '@prisma/client'

export const timetableRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

// ─────────────────────────────────────────────────────────────
//  GET /timetable/me — the signed-in learner/teacher's own schedule
// ─────────────────────────────────────────────────────────────
timetableRouter.get(
  '/timetable/me',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await timetable.getMyTimetable(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /timetable/today — dashboard widget
// ─────────────────────────────────────────────────────────────
timetableRouter.get(
  '/timetable/today',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await timetable.getUpcomingClasses(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /timetable/options — classes/sections/subjects/teachers (editor)
// ─────────────────────────────────────────────────────────────
timetableRouter.get(
  '/timetable/options',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await timetable.getTimetableOptions(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /timetable/section/:sectionId
// ─────────────────────────────────────────────────────────────
timetableRouter.get(
  '/timetable/section/:sectionId',
  authenticate,
  validate({ params: sectionParam }),
  asyncHandler(async (req, res) => {
    ok(res, await timetable.getSectionTimetable(actorOf(req), String(req.params['sectionId'])))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /timetable/teacher/:teacherId  (or /timetable/teacher for self)
// ─────────────────────────────────────────────────────────────
timetableRouter.get(
  '/timetable/teacher/:teacherId',
  authenticate,
  validate({ params: teacherParam }),
  asyncHandler(async (req, res) => {
    ok(res, await timetable.getTeacherTimetable(actorOf(req), String(req.params['teacherId'])))
  }),
)

timetableRouter.get(
  '/timetable/teacher',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await timetable.getTeacherTimetable(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Slot CRUD (ADMIN)
// ─────────────────────────────────────────────────────────────
timetableRouter.post(
  '/timetable/slots',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createSlotSchema }),
  asyncHandler(async (req, res) => {
    created(res, await timetable.createSlot(actorOf(req), req.body as z.infer<typeof createSlotSchema>))
  }),
)

timetableRouter.patch(
  '/timetable/slots/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: slotIdParam, body: updateSlotSchema }),
  asyncHandler(async (req, res) => {
    ok(
      res,
      await timetable.updateSlot(
        actorOf(req),
        String(req.params['id']),
        req.body as z.infer<typeof updateSlotSchema>,
      ),
    )
  }),
)

timetableRouter.delete(
  '/timetable/slots/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: slotIdParam }),
  asyncHandler(async (req, res) => {
    await timetable.deleteSlot(actorOf(req), String(req.params['id']))
    noContent(res)
  }),
)
