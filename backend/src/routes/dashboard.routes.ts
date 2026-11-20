import { Router } from 'express'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate } from '../middleware/auth.js'
import { ok } from '../utils/response.js'
import * as dashboard from '../services/dashboard.service.js'
import type { Role } from '@prisma/client'

export const dashboardRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

/**
 * GET /dashboard/summary
 *
 * Role-shaped payload: admins get school-wide numbers, teachers only their own
 * sections, learners/parents only their own attendance, results and invoices.
 */
dashboardRouter.get(
  '/dashboard/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await dashboard.getDashboardSummary(actorOf(req)))
  }),
)
