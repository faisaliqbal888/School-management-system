import { Prisma, type NotificationAudience, type NotificationChannel, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, forbidden, notFound } from '../utils/errors.js'
import { deliver, isChannelEnabled, summarise, type DeliveryChannel } from './delivery.service.js'

/**
 * Notifications module.
 *
 * A notice is broadcast to an audience:
 *   ALL        everyone
 *   ADMINS  /  TEACHERS  /  STUDENTS  /  PARENTS   — one role
 *   CLASS      every learner (and their guardians) of one class
 *
 * Members see the notices addressed to them; read state is per user, so a
 * notice stays unread until that particular account opens it.
 *
 * Access rules:
 *   ADMIN            — compose/delete anything, see delivery stats
 *   TEACHER          — compose to their own classes' students/parents, delete own
 *   STUDENT / PARENT — read + mark read their own inbox
 */

export interface Actor {
  id: string
  role: Role
}

const AUDIENCE_ROLE: Partial<Record<NotificationAudience, Role>> = {
  ADMINS: 'ADMIN',
  TEACHERS: 'TEACHER',
  STUDENTS: 'STUDENT',
  PARENTS: 'PARENT',
}

/** Which audiences the caller is allowed to target. */
const COMPOSE_AUDIENCES: Partial<Record<Role, NotificationAudience[]>> = {
  ADMIN: ['ALL', 'ADMINS', 'TEACHERS', 'STUDENTS', 'PARENTS', 'CLASS'],
  TEACHER: ['STUDENTS', 'PARENTS', 'CLASS'],
}

export interface NotificationRow {
  id: string
  title: string
  body: string
  audience: NotificationAudience
  channel: NotificationChannel
  classId: string | null
  className: string | null
  authorId: string | null
  authorName: string | null
  sentAt: string | null
  createdAt: string
  isRead: boolean
  readAt: string | null
}

export interface NotificationStats {
  total: number
  unread: number
  byAudience: Record<string, number>
}

const NOTICE_SELECT = {
  id: true,
  title: true,
  body: true,
  audience: true,
  channel: true,
  classId: true,
  authorId: true,
  sentAt: true,
  createdAt: true,
  class: { select: { name: true } },
  author: { select: { name: true } },
  reads: { select: { userId: true, readAt: true } },
} satisfies Prisma.NotificationSelect

type NoticeRecord = Prisma.NotificationGetPayload<{ select: typeof NOTICE_SELECT }>

function toRow(notice: NoticeRecord, userId: string): NotificationRow {
  const read = notice.reads.find((r) => r.userId === userId)
  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    audience: notice.audience,
    channel: notice.channel,
    classId: notice.classId,
    className: notice.class?.name ?? null,
    authorId: notice.authorId,
    authorName: notice.author?.name ?? 'School Administration',
    sentAt: notice.sentAt?.toISOString() ?? null,
    createdAt: notice.createdAt.toISOString(),
    isRead: Boolean(read),
    readAt: read?.readAt.toISOString() ?? null,
  }
}

/** Classes a teacher actually teaches — used to scope CLASS notices. */
async function teacherClassIds(userId: string): Promise<string[]> {
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } })
  if (!teacher) return []

  const [slots, subjects] = await Promise.all([
    prisma.timetableSlot.findMany({ where: { teacherId: teacher.id }, select: { classId: true } }),
    prisma.teacherSubject.findMany({
      where: { teacherId: teacher.id },
      select: { subject: { select: { classId: true } } },
    }),
  ])
  const subjectClasses = subjects.map((s) => s.subject.classId)

  return [...new Set([...slots.map((s) => s.classId), ...subjectClasses])]
}

/** Class ids the signed-in learner (or their children) sit in. */
async function learnerClassIds(actor: Actor): Promise<string[]> {
  if (actor.role === 'STUDENT') {
    const enrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE', student: { userId: actor.id } },
      select: { classId: true },
    })
    return [...new Set(enrollments.map((e) => e.classId))]
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { status: 'ACTIVE', student: { guardians: { some: { parent: { userId: actor.id } } } } },
    select: { classId: true },
  })
  return [...new Set(enrollments.map((e) => e.classId))]
}

/**
 * Filter that matches every notice the actor should receive.
 * ADMIN/TEACHER additionally see what they themselves composed.
 */
async function audienceFilter(actor: Actor): Promise<Prisma.NotificationWhereInput> {
  const roleAudience = (Object.keys(AUDIENCE_ROLE) as NotificationAudience[]).find(
    (audience) => AUDIENCE_ROLE[audience] === actor.role,
  )

  const clauses: Prisma.NotificationWhereInput[] = [{ audience: 'ALL' }]
  if (roleAudience) clauses.push({ audience: roleAudience })

  if (actor.role === 'STUDENT' || actor.role === 'PARENT') {
    const classIds = await learnerClassIds(actor)
    if (classIds.length > 0) clauses.push({ audience: 'CLASS', classId: { in: classIds } })
  }

  if (actor.role === 'ADMIN' || actor.role === 'TEACHER') {
    // staff also see their own outgoing notices, whatever the audience
    clauses.push({ authorId: actor.id })
  }

  return clauses.length === 1 ? clauses[0]! : { OR: clauses }
}

// ─────────────────────────────────────────────────────────────
//  inbox
// ─────────────────────────────────────────────────────────────

export interface ListNotificationsInput {
  page?: number
  limit?: number
  search?: string
  audience?: NotificationAudience
  unreadOnly?: boolean
}

export async function listNotifications(actor: Actor, input: ListNotificationsInput) {
  const page = Math.max(1, input.page ?? 1)
  const limit = Math.min(50, Math.max(1, input.limit ?? 20))

  const where: Prisma.NotificationWhereInput = {
    AND: [
      await audienceFilter(actor),
      input.search
        ? {
            OR: [
              { title: { contains: input.search, mode: 'insensitive' } },
              { body: { contains: input.search, mode: 'insensitive' } },
            ],
          }
        : {},
      input.audience ? { audience: input.audience } : {},
      input.unreadOnly ? { reads: { none: { userId: actor.id } } } : {},
    ],
  }

  const [total, notices] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      select: NOTICE_SELECT,
      orderBy: [{ sentAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return {
    notifications: notices.map((n) => toRow(n, actor.id)),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  }
}

export async function getUnreadCount(actor: Actor) {
  const total = await prisma.notification.count({ where: await audienceFilter(actor) })
  const read = await prisma.notificationRead.count({
    where: { userId: actor.id, notification: await audienceFilter(actor) },
  })
  return { total, unread: Math.max(0, total - read) }
}

export async function getNotification(actor: Actor, id: string): Promise<NotificationRow> {
  const notice = await prisma.notification.findFirst({
    where: { id, AND: [await audienceFilter(actor)] },
    select: NOTICE_SELECT,
  })
  if (!notice) throw notFound('Notification')
  return toRow(notice, actor.id)
}

// ─────────────────────────────────────────────────────────────
//  read receipts
// ─────────────────────────────────────────────────────────────

export async function markRead(actor: Actor, id: string, read = true) {
  const notice = await prisma.notification.findUnique({ where: { id }, select: { id: true } })
  if (!notice) throw notFound('Notification')

  if (read) {
    await prisma.notificationRead.upsert({
      where: { notificationId_userId: { notificationId: id, userId: actor.id } },
      create: { notificationId: id, userId: actor.id },
      update: {},
    })
  } else {
    await prisma.notificationRead.deleteMany({ where: { notificationId: id, userId: actor.id } })
  }

  return getNotification(actor, id)
}

export async function markAllRead(actor: Actor) {
  const filter = await audienceFilter(actor)
  const notices = await prisma.notification.findMany({
    where: { AND: [filter, { reads: { none: { userId: actor.id } } }] },
    select: { id: true },
  })

  if (notices.length > 0) {
    await prisma.notificationRead.createMany({
      data: notices.map((n) => ({ notificationId: n.id, userId: actor.id })),
      skipDuplicates: true,
    })
  }

  return { marked: notices.length }
}

// ─────────────────────────────────────────────────────────────
//  composing (ADMIN / TEACHER)
// ─────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  title: string
  body: string
  audience: NotificationAudience
  channel?: NotificationChannel
  classId?: string | null
}

/**
 * Everyone who should receive `audience` over an outbound channel.
 *
 * Email addresses come from the account; phone numbers do not exist on `User`,
 * so SMS reach is computed from guardian records (parents are the people a
 * school actually texts). Duplicates are collapsed so a parent with two
 * children in the same class is messaged once.
 */
async function resolveRecipients(
  audience: NotificationAudience,
  classId: string | null,
): Promise<{ emails: string[]; phones: string[] }> {
  // `classId` only narrows CLASS notices; the other audiences are role-wide.
  const classFilter = audience === 'CLASS' && classId ? { classId } : {}

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      ...(AUDIENCE_ROLE[audience] ? { role: AUDIENCE_ROLE[audience] } : {}),
      ...(audience === 'CLASS' && classId
        ? { student: { is: { classId, status: 'ACTIVE' } } }
        : {}),
    },
    select: { email: true },
  })

  const emails = new Set(users.map((u) => u.email).filter(Boolean))

  // Parents/guardians of the targeted learners carry the phone numbers.
  const wantsParents = audience === 'PARENTS' || audience === 'CLASS' || audience === 'ALL'
  const phones = new Set<string>()
  if (wantsParents) {
    const guardians = await prisma.guardian.findMany({
      where: {
        phone: { not: '' },
        ...(audience === 'CLASS' || Object.keys(classFilter).length
          ? { student: { is: { ...classFilter, status: 'ACTIVE' } } }
          : {}),
      },
      select: { phone: true },
    })
    for (const g of guardians) {
      const clean = g.phone.replace(/[^\d+]/g, '')
      if (clean.length >= 10) phones.add(clean)
    }
  }

  return { emails: [...emails], phones: [...phones] }
}

export async function createNotification(actor: Actor, input: CreateNotificationInput) {
  const allowed = COMPOSE_AUDIENCES[actor.role]
  if (!allowed) throw forbidden('Only staff can send notifications')
  if (!allowed.includes(input.audience)) {
    throw forbidden(`You cannot send notifications to ${input.audience.toLowerCase()}`)
  }

  if (input.audience === 'CLASS') {
    if (!input.classId) throw badRequest('Choose the class this notice is for')

    const cls = await prisma.class.findUnique({ where: { id: input.classId }, select: { id: true } })
    if (!cls) throw badRequest('Class not found')

    if (actor.role === 'TEACHER') {
      const own = await teacherClassIds(actor.id)
      if (!own.includes(input.classId)) throw forbidden('You can only post notices to your own classes')
    }
  }

  const notice = await prisma.notification.create({
    data: {
      title: input.title,
      body: input.body,
      audience: input.audience,
      channel: input.channel ?? 'IN_APP',
      classId: input.audience === 'CLASS' ? (input.classId ?? null) : null,
      authorId: actor.id,
    },
    select: { id: true },
  })

  // In-app row is saved first: the notice must exist even if a provider is down.
  const result: {
    id: string
    delivery?: ReturnType<typeof summarise> & { channels: DeliveryChannel[] }
  } = { id: notice.id }

  const channel = input.channel ?? 'IN_APP'
  if (channel !== 'IN_APP' && isChannelEnabled(channel)) {
    const recipients = await resolveRecipients(input.audience, input.classId ?? null)
    const targets =
      channel === 'EMAIL'
        ? recipients.emails.map((to) => ({ to, subject: input.title, text: input.body }))
        : recipients.phones.map((to) => ({ to, text: `${input.title}\n\n${input.body}` }))

    const results = await deliver(channel, targets)
    result.delivery = { ...summarise(results), channels: [channel] }
  } else if (channel !== 'IN_APP') {
    // Asking for EMAIL/SMS while delivery is switched off is a configuration
    // fact, not a user error — report it instead of silently doing nothing.
    result.delivery = { attempted: 0, sent: 0, failed: 0, channels: [] }
  }

  return result
}

export async function deleteNotification(actor: Actor, id: string) {
  const notice = await prisma.notification.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  })
  if (!notice) throw notFound('Notification')

  if (actor.role !== 'ADMIN' && notice.authorId !== actor.id) {
    throw forbidden('You can only delete notifications you sent')
  }

  await prisma.notification.delete({ where: { id } })
  return { deleted: true }
}

// ─────────────────────────────────────────────────────────────
//  admin dashboard
// ─────────────────────────────────────────────────────────────

/** How many people a notice actually reached + how many opened it. */
export async function getDeliveryStats(actor: Actor) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can view delivery stats')

  const [total, notices, readers] = await prisma.$transaction([
    prisma.notification.count(),
    prisma.notification.findMany({
      select: { id: true, title: true, audience: true, classId: true, sentAt: true, createdAt: true, reads: { select: { userId: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
  ])

  return {
    total,
    activeUsers: readers,
    recent: notices.map((n) => ({
      id: n.id,
      title: n.title,
      audience: n.audience,
      readCount: n.reads.length,
      sentAt: (n.sentAt ?? n.createdAt).toISOString(),
    })),
  }
}

/** Class options for the composer (ADMIN: all, TEACHER: own classes). */
export async function getComposerOptions(actor: Actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can compose notifications')
  }

  const where: Prisma.ClassWhereInput =
    actor.role === 'TEACHER' ? { id: { in: await teacherClassIds(actor.id) } } : {}

  const classes = await prisma.class.findMany({
    where,
    orderBy: [{ level: 'desc' }],
    select: {
      id: true,
      name: true,
      _count: { select: { students: true } },
    },
  })

  return {
    audiences: COMPOSE_AUDIENCES[actor.role] ?? [],
    classes: classes.map((c) => ({ id: c.id, name: c.name, students: c._count.students })),
  }
}
