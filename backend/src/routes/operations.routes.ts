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

// ── transport ────────────────────────────────────────────────
const VEHICLE_STATUS = ['ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE'] as const

const vehicleBody = z.object({
  registrationNo: z.string().trim().min(2, 'Registration is required').max(20),
  model: z.string().trim().min(1, 'Model is required').max(60),
  capacity: z.coerce.number().int().min(1, 'At least one seat').max(120),
  driverName: z.string().trim().min(2, 'Driver name is required').max(80),
  driverPhone: z.string().trim().min(7, 'Driver phone is required').max(20),
  conductorName: z.string().trim().max(80).nullish(),
  status: z.enum(VEHICLE_STATUS).optional(),
  lastServiceAt: z.string().nullish(),
})

const vehiclePatch = vehicleBody.partial()

const routeBody = z.object({
  name: z.string().trim().min(3, 'Route name is required').max(80),
  startPoint: z.string().trim().min(1, 'Start point is required').max(80),
  endPoint: z.string().trim().min(1, 'End point is required').max(80),
  distanceKm: z.coerce.number().min(0).max(500).optional(),
  monthlyFee: z.coerce.number().min(0).max(1_000_000).optional(),
  vehicleId: z.string().nullish(),
  isActive: z.boolean().optional(),
})

const routePatch = routeBody.partial()

const assignBody = z.object({
  studentId: z.string().min(1, 'Choose a learner'),
  stopName: z.string().trim().max(80).nullish(),
})

// ── hostel ───────────────────────────────────────────────────
const ROOM_TYPE = ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORMITORY'] as const
const ROOM_STATUS = ['AVAILABLE', 'FULL', 'MAINTENANCE'] as const

const roomBody = z.object({
  block: z.string().trim().min(1, 'Block is required').max(20),
  roomNo: z.string().trim().min(1, 'Room number is required').max(20),
  type: z.enum(ROOM_TYPE).optional(),
  capacity: z.coerce.number().int().min(1).max(40),
  monthlyFee: z.coerce.number().min(0).max(1_000_000).optional(),
  status: z.enum(ROOM_STATUS).optional(),
})

const roomPatch = roomBody.partial()
const allocateBody = z.object({ studentId: z.string().min(1, 'Choose a learner') })

// ── inventory ────────────────────────────────────────────────
const CONDITION = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'] as const

const itemBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  code: z.string().trim().min(1, 'Code is required').max(40),
  category: z.string().trim().min(1, 'Category is required').max(60),
  quantity: z.coerce.number().int().min(0).optional(),
  minQuantity: z.coerce.number().int().min(0).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  location: z.string().trim().max(80).nullish(),
  supplier: z.string().trim().max(120).nullish(),
  condition: z.enum(CONDITION).optional(),
  purchasedAt: z.string().nullish(),
})

const itemPatch = itemBody.partial()

const adjustBody = z.object({
  delta: z.coerce.number().int().refine((v) => v !== 0, 'Enter a non-zero change'),
  reason: z.string().trim().min(3, 'Give a reason for the adjustment').max(200),
})

// ── HR ───────────────────────────────────────────────────────
const periodBody = z.object({ period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use 2026-01') })

const leaveBody = z.object({
  teacherId: z.string().nullish(),
  staffId: z.string().nullish(),
  fromDate: z.string().min(8, 'Choose a start date'),
  toDate: z.string().min(8, 'Choose an end date'),
  reason: z.string().trim().min(3, 'Give a reason').max(300),
})

const decisionBody = z.object({ decision: z.enum(['APPROVED', 'REJECTED']) })

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

// ═════════════════════════════════════════════════════════════
//  TRANSPORT — write paths (ADMIN)
// ═════════════════════════════════════════════════════════════

operationsRouter.post(
  '/transport/vehicles',
  authenticate,
  authorize('ADMIN'),
  validate({ body: vehicleBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.createVehicle(actorOf(req), req.body))
  }),
)

operationsRouter.patch(
  '/transport/vehicles/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: vehiclePatch }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.updateVehicle(actorOf(req), String(req.params.id), req.body))
  }),
)

operationsRouter.delete(
  '/transport/vehicles/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.deleteVehicle(actorOf(req), String(req.params.id)))
  }),
)

operationsRouter.post(
  '/transport/routes',
  authenticate,
  authorize('ADMIN'),
  validate({ body: routeBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.createRoute(actorOf(req), req.body))
  }),
)

operationsRouter.patch(
  '/transport/routes/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: routePatch }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.updateRoute(actorOf(req), String(req.params.id), req.body))
  }),
)

operationsRouter.delete(
  '/transport/routes/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.deleteRoute(actorOf(req), String(req.params.id)))
  }),
)

operationsRouter.post(
  '/transport/routes/:id/riders',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: assignBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.assignStudentToRoute(actorOf(req), String(req.params.id), req.body))
  }),
)

operationsRouter.delete(
  '/transport/riders/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.removeStudentFromRoute(actorOf(req), String(req.params.id)))
  }),
)

// ═════════════════════════════════════════════════════════════
//  HOSTEL — write paths (ADMIN)
// ═════════════════════════════════════════════════════════════

operationsRouter.post(
  '/hostel/rooms',
  authenticate,
  authorize('ADMIN'),
  validate({ body: roomBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.createRoom(actorOf(req), req.body))
  }),
)

operationsRouter.patch(
  '/hostel/rooms/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: roomPatch }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.updateRoom(actorOf(req), String(req.params.id), req.body))
  }),
)

operationsRouter.delete(
  '/hostel/rooms/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.deleteRoom(actorOf(req), String(req.params.id)))
  }),
)

operationsRouter.post(
  '/hostel/rooms/:id/allocate',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: allocateBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.allocateRoom(actorOf(req), String(req.params.id), req.body.studentId))
  }),
)

operationsRouter.post(
  '/hostel/allocations/:id/vacate',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.vacateRoom(actorOf(req), String(req.params.id)))
  }),
)

// ═════════════════════════════════════════════════════════════
//  INVENTORY — write paths (ADMIN)
// ═════════════════════════════════════════════════════════════

operationsRouter.post(
  '/inventory/items',
  authenticate,
  authorize('ADMIN'),
  validate({ body: itemBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.createItem(actorOf(req), req.body))
  }),
)

operationsRouter.patch(
  '/inventory/items/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: itemPatch }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.updateItem(actorOf(req), String(req.params.id), req.body))
  }),
)

operationsRouter.delete(
  '/inventory/items/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.deleteItem(actorOf(req), String(req.params.id)))
  }),
)

operationsRouter.post(
  '/inventory/items/:id/adjust',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: adjustBody }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.adjustStock(actorOf(req), String(req.params.id), req.body))
  }),
)

// ═════════════════════════════════════════════════════════════
//  HR — payroll runs + leave workflow (ADMIN)
// ═════════════════════════════════════════════════════════════

operationsRouter.post(
  '/hr/payroll/run',
  authenticate,
  authorize('ADMIN'),
  validate({ body: periodBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.runPayroll(actorOf(req), req.body.period))
  }),
)

operationsRouter.post(
  '/hr/payroll/pay',
  authenticate,
  authorize('ADMIN'),
  validate({ body: periodBody }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.markPayrollPaid(actorOf(req), req.body.period))
  }),
)

operationsRouter.post(
  '/hr/leaves',
  authenticate,
  authorize('ADMIN'),
  validate({ body: leaveBody }),
  asyncHandler(async (req, res) => {
    created(res, await ops.createLeaveRequest(actorOf(req), req.body))
  }),
)

operationsRouter.patch(
  '/hr/leaves/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: decisionBody }),
  asyncHandler(async (req, res) => {
    ok(res, await ops.decideLeave(actorOf(req), String(req.params.id), req.body.decision))
  }),
)
