import { Router } from 'express'
import type { z } from 'zod'
import { z as zod } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok } from '../utils/response.js'
import * as reports from '../services/reports.service.js'
import type { Role } from '@prisma/client'

export const reportsRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

const rangeQuery = zod.object({
  days: zod.coerce.number().int().min(1).max(365).optional(),
})

const csvQuery = zod.object({
  type: zod.enum(['fees', 'attendance', 'performance', 'enrolment']).default('fees'),
  days: zod.coerce.number().int().min(1).max(365).optional(),
})

reportsRouter.get(
  '/reports/fees',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await reports.feeReportByClass(actorOf(req)))
  }),
)

reportsRouter.get(
  '/reports/attendance',
  authenticate,
  authorize('ADMIN'),
  validate({ query: rangeQuery }),
  asyncHandler(async (req, res) => {
    const { days } = req.query as unknown as z.infer<typeof rangeQuery>
    ok(res, await reports.attendanceReport(actorOf(req), days ?? 30))
  }),
)

reportsRouter.get(
  '/reports/performance',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await reports.performanceReport(actorOf(req)))
  }),
)

reportsRouter.get(
  '/reports/enrolment',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await reports.enrolmentReport(actorOf(req)))
  }),
)

reportsRouter.get(
  '/reports/export',
  authenticate,
  authorize('ADMIN'),
  validate({ query: csvQuery }),
  asyncHandler(async (req, res) => {
    const { type, days } = req.query as unknown as z.infer<typeof csvQuery>
    const { filename, csv } = await reports.reportsCsv(actorOf(req), type, days ?? 30)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  }),
)
