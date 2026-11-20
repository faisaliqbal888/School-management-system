import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../utils/response.js'
import * as ops from '../services/operations.service.js'
import type { Role } from '@prisma/client'

export const operationsRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  status: z.string().trim().max(30).optional(),
})

const issueBody = z.object({
  bookId: z.string().min(1),
  studentId: z.string().min(1),
  dueDate: z.string().min(8),
})

const returnBody = z.object({ fine: z.coerce.number().min(0).optional() })

const idParam = z.object({ id: z.string().min(1) })

// ── Library ──────────────────────────────────────────────────
operationsRouter.get(
  '/library/overview',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await ops.libraryOverview(actorOf(req)))
  }),
)

operationsRouter.get(
  '/library/books',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ query: pagination }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as { page: number; limit: number; search?: string; category?: string }
    const { items, meta } = await ops.listBooks(filters)
    ok(res, items, meta)
  }),
)

operationsRouter.get(
  '/library/issues',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ query: pagination }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as { page: number; limit: number; search?: string; status?: string }
    const { items, meta } = await ops.listBookIssues(filters)
    ok(res, items, meta)
  }),
)

operationsRouter.post(
  '/library/issues',
  authenticate,
  authorize('ADMIN'),
  validate({ body: issueBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.issueBook(actorOf(req), req.body as z.infer<typeof issueBody>))
  }),
)

operationsRouter.patch(
  '/library/issues/:id/return',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: returnBody }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof returnBody>
    ok(res, await ops.returnBook(actorOf(req), String(req.params['id']), body.fine))
  }),
)

operationsRouter.post(
  '/library/refresh-overdue',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await ops.refreshOverdueLoans(actorOf(req)))
  }),
)

// ── Transport ────────────────────────────────────────────────
operationsRouter.get(
  '/transport/overview',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await ops.transportOverview(actorOf(req)))
  }),
)

operationsRouter.get(
  '/transport/routes/:id/riders',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.listRouteRiders(actorOf(req), String(req.params['id'])))
  }),
)

// ── Hostel ───────────────────────────────────────────────────
operationsRouter.get(
  '/hostel/overview',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await ops.hostelOverview(actorOf(req)))
  }),
)

// ── HR / payroll ─────────────────────────────────────────────
operationsRouter.get(
  '/hr/payroll',
  authenticate,
  authorize('ADMIN'),
  validate({ query: z.object({ period: z.string().trim().max(20).optional() }) }),
  asyncHandler(async (req, res) => {
    const { period } = req.query as unknown as { period?: string }
    ok(res, await ops.payrollOverview(actorOf(req), period))
  }),
)

operationsRouter.get(
  '/hr/leaves',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await ops.listLeaveRequests(actorOf(req)))
  }),
)

// ── Inventory ────────────────────────────────────────────────
operationsRouter.get(
  '/inventory/overview',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await ops.inventoryOverview(actorOf(req)))
  }),
)
