import { Router } from 'express'
import type { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok } from '../utils/response.js'
import * as attendance from '../services/attendance.service.js'
import {
  attendanceHistoryQuery,
  attendanceSummaryQuery,
  bulkMarkSchema,
  rosterQuery,
  sectionParam,
} from '../validators/attendance.validator.js'
import type { Role } from '@prisma/client'

export const attendanceRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

// ─────────────────────────────────────────────────────────────
//  GET /attendance/sections — sections this actor may mark
// ─────────────────────────────────────────────────────────────
attendanceRouter.get(
  '/attendance/sections',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await attendance.listAttendanceSections(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /attendance/overview — today's school-wide status (staff)
// ─────────────────────────────────────────────────────────────
attendanceRouter.get(
  '/attendance/overview',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await attendance.getTodayOverview(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /attendance/summary — rate + monthly breakdown (all roles)
// ─────────────────────────────────────────────────────────────
attendanceRouter.get(
  '/attendance/summary',
  authenticate,
  validate({ query: attendanceSummaryQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof attendanceSummaryQuery>
    ok(res, await attendance.getAttendanceSummary(actorOf(req), q))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /attendance/roster/:sectionId?date=YYYY-MM-DD  (staff)
// ─────────────────────────────────────────────────────────────
attendanceRouter.get(
  '/attendance/roster/:sectionId',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ params: sectionParam, query: rosterQuery }),
  asyncHandler(async (req, res) => {
    const { date } = req.query as unknown as z.infer<typeof rosterQuery>
    ok(res, await attendance.getSectionRoster(actorOf(req), String(req.params['sectionId']), date))
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /attendance — history, scoped by role
// ─────────────────────────────────────────────────────────────
attendanceRouter.get(
  '/attendance',
  authenticate,
  validate({ query: attendanceHistoryQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof attendanceHistoryQuery>
    const { items, meta } = await attendance.listAttendance(actorOf(req), filters)
    ok(res, items, meta)
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /attendance/bulk — mark / correct a whole section (staff)
// ─────────────────────────────────────────────────────────────
attendanceRouter.post(
  '/attendance/bulk',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: bulkMarkSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof bulkMarkSchema>
    ok(res, await attendance.bulkMarkAttendance(actorOf(req), body))
  }),
)
