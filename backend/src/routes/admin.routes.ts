import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../utils/response.js'
import * as admin from '../services/admin.service.js'
import { strongPasswordSchema } from '../validators/auth.validator.js'
import { prisma } from '../config/prisma.js'
import type { Role } from '@prisma/client'

export const adminRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  search: z.string().trim().max(120).optional(),
})

const createBody = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  password: strongPasswordSchema,
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT', 'PARENT']),
  phone: z.string().trim().max(30).optional(),
})

const statusBody = z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']) })

const auditLogQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().trim().max(80).optional(),
  userId: z.string().trim().max(40).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

const settingsBody = z.object({
  updates: z
    .array(z.object({ key: z.string().trim().min(1).max(80), value: z.string().max(500) }))
    .min(1)
    .max(50),
})

// ── Users ────────────────────────────────────────────────────
adminRouter.get(
  '/admin/users',
  authenticate,
  authorize('ADMIN'),
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as admin.UserFilters
    const { users, meta, stats } = await admin.listUsers(actorOf(req), filters)
    res.status(200).json({ success: true, data: users, meta, stats })
  }),
)

adminRouter.post(
  '/admin/users',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createBody }),
  asyncHandler(async (req, res) => {
    created(res, await admin.createUser(actorOf(req), req.body))
  }),
)

adminRouter.patch(
  '/admin/users/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate({ body: statusBody }),
  asyncHandler(async (req, res) => {
    ok(res, await admin.setUserStatus(actorOf(req), String(req.params.id), req.body.status))
  }),
)

adminRouter.post(
  '/admin/users/:id/reset-password',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await admin.resetPassword(actorOf(req), String(req.params.id)))
  }),
)

// ── Staff ────────────────────────────────────────────────────
adminRouter.get(
  '/admin/staff',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await admin.listStaffDirectory(actorOf(req)))
  }),
)

// ── Alerts ───────────────────────────────────────────────────
adminRouter.get(
  '/admin/alerts',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await admin.systemAlerts(actorOf(req)))
  }),
)

// ── Settings ─────────────────────────────────────────────────
adminRouter.get(
  '/admin/settings',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await admin.listSettings(actorOf(req)))
  }),
)

adminRouter.patch(
  '/admin/settings',
  authenticate,
  authorize('ADMIN'),
  validate({ body: settingsBody }),
  asyncHandler(async (req, res) => {
    ok(res, await admin.updateSettings(actorOf(req), req.body.updates))
  }),
)

// ── Audit log (security trail) ───────────────────────────────
adminRouter.get(
  '/admin/audit-logs',
  authenticate,
  authorize('ADMIN'),
  validate({ query: auditLogQuery }),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof auditLogQuery>
    const where = {
      ...(q.action ? { action: { contains: q.action, mode: 'insensitive' as const } } : {}),
      ...(q.userId ? { userId: q.userId } : {}),
      ...(q.from || q.to
        ? {
            createdAt: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(q.to) } : {}),
            },
          }
        : {}),
    }

    // One transaction keeps total and page consistent while rows are written.
    const [rows, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    ok(res, rows, {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.limit)),
    })
  }),
)
