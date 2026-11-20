import { z } from 'zod'

const AUDIENCE = ['ALL', 'ADMINS', 'TEACHERS', 'STUDENTS', 'PARENTS', 'CLASS'] as const
const CHANNEL = ['IN_APP', 'EMAIL', 'SMS'] as const

export const listNotificationsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  search: z.string().trim().max(120).optional(),
  audience: z.enum(AUDIENCE).optional(),
  unreadOnly: z.coerce.boolean().optional(),
})

export const createNotificationSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(140),
  body: z.string().trim().min(5, 'Message is too short').max(4000),
  audience: z.enum(AUDIENCE),
  channel: z.enum(CHANNEL).optional(),
  classId: z.string().min(1).nullish(),
})

export const markReadSchema = z.object({
  read: z.boolean().optional(),
})

export const notificationIdParam = z.object({ id: z.string().min(1) })
