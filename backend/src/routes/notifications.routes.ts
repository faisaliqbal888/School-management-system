import { Router } from 'express'
import type { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../utils/response.js'
import * as notifications from '../services/notifications.service.js'
import {
  createNotificationSchema,
  listNotificationsSchema,
  markReadSchema,
  notificationIdParam,
} from '../validators/notifications.validator.js'
import type { Role } from '@prisma/client'

export const notificationsRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

// ─────────────────────────────────────────────────────────────
//  Inbox
// ─────────────────────────────────────────────────────────────
notificationsRouter.get(
  '/notifications',
  authenticate,
  validate({ query: listNotificationsSchema }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof listNotificationsSchema>
    const { notifications: items, meta } = await notifications.listNotifications(actorOf(req), filters)
    ok(res, items, meta)
  }),
)

notificationsRouter.get(
  '/notifications/unread-count',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await notifications.getUnreadCount(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Composer (must come before /:id so "options" isn't parsed as an id)
// ─────────────────────────────────────────────────────────────
notificationsRouter.get(
  '/notifications/options',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  asyncHandler(async (req, res) => {
    ok(res, await notifications.getComposerOptions(actorOf(req)))
  }),
)

notificationsRouter.get(
  '/notifications/stats',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await notifications.getDeliveryStats(actorOf(req)))
  }),
)

notificationsRouter.post(
  '/notifications',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: createNotificationSchema }),
  asyncHandler(async (req, res) => {
    created(
      res,
      await notifications.createNotification(
        actorOf(req),
        req.body as z.infer<typeof createNotificationSchema>,
      ),
    )
  }),
)

notificationsRouter.post(
  '/notifications/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await notifications.markAllRead(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Single notice
// ─────────────────────────────────────────────────────────────
notificationsRouter.get(
  '/notifications/:id',
  authenticate,
  validate({ params: notificationIdParam }),
  asyncHandler(async (req, res) => {
    ok(res, await notifications.getNotification(actorOf(req), String(req.params['id'])))
  }),
)

notificationsRouter.patch(
  '/notifications/:id',
  authenticate,
  validate({ params: notificationIdParam, body: markReadSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof markReadSchema>
    ok(res, await notifications.markRead(actorOf(req), String(req.params['id']), body.read ?? true))
  }),
)

notificationsRouter.delete(
  '/notifications/:id',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ params: notificationIdParam }),
  asyncHandler(async (req, res) => {
    await notifications.deleteNotification(actorOf(req), String(req.params['id']))
    res.status(204).end()
  }),
)
