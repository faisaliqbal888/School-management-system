import { Prisma, type Role, type UserStatus } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, forbidden, notFound } from '../utils/errors.js'
import { hashPassword } from '../utils/password.js'

/** Writes an audit row; failures here must never break the admin action. */
async function audit(
  actorId: string,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Prisma.InputJsonObject,
) {
  try {
    await prisma.auditLog.create({ data: { userId: actorId, action, entity, entityId, metadata } })
  } catch {
    /* auditing is best-effort */
  }
}

/**
 * Administration: the user directory, credential resets and school settings.
 */

export interface Actor {
  id: string
  role: Role
}

const money = (value: Prisma.Decimal | number | string | null | undefined): number =>
  value === null || value === undefined ? 0 : Math.round(Number(value.toString()) * 100) / 100

function requireAdmin(actor: Actor) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can manage this resource')
}

export interface UserFilters {
  page: number
  limit: number
  role?: string
  status?: string
  search?: string
}

export async function listUsers(actor: Actor, filters: UserFilters) {
  requireAdmin(actor)

  const where = {
    ...(filters.role ? { role: filters.role as Role } : {}),
    ...(filters.status ? { status: filters.status as UserStatus } : {}),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { email: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        student: { select: { admissionNo: true, class: { select: { name: true } } } },
        teacher: { select: { employeeNo: true, department: true } },
      },
    }),
  ])

  const [byRole, active, suspended] = await Promise.all([
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: { not: 'ACTIVE' } } }),
  ])

  return {
    users: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      status: row.status,
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      admissionNo: row.student?.admissionNo ?? null,
      employeeNo: row.teacher?.employeeNo ?? null,
      className: row.student?.class?.name ?? null,
      department: row.teacher?.department ?? null,
    })),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
    stats: {
      total: byRole.reduce((sum, entry) => sum + entry._count._all, 0),
      active,
      inactive: suspended,
      byRole: Object.fromEntries(byRole.map((entry) => [entry.role, entry._count._all])),
    },
  }
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
  phone?: string
}

export async function createUser(actor: Actor, input: CreateUserInput) {
  requireAdmin(actor)

  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } })
  if (existing) throw badRequest('A user with that email already exists')

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      role: input.role,
      passwordHash: await hashPassword(input.password),
    },
    select: { id: true, name: true, email: true, role: true, status: true, phone: true, createdAt: true },
  })

  await audit(actor.id, 'user.create', 'User', user.id, { role: user.role })

  return { ...user, createdAt: user.createdAt.toISOString() }
}

export async function setUserStatus(actor: Actor, userId: string, status: UserStatus) {
  requireAdmin(actor)
  if (userId === actor.id) throw badRequest('You cannot change your own account status')

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } })
  if (!target) throw notFound('User not found')

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: { id: true, name: true, email: true, role: true, status: true },
  })

  await audit(actor.id, 'user.status', 'User', userId, { status })

  return user
}

/** Issues a fresh password and returns it once so an admin can hand it over. */
export async function resetPassword(actor: Actor, userId: string) {
  requireAdmin(actor)

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } })
  if (!target) throw notFound('User not found')

  const password = `Sms-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password) },
  })
  await prisma.refreshToken.deleteMany({ where: { userId } })

  await audit(actor.id, 'user.reset-password', 'User', userId)

  return { userId, name: target.name, password }
}

// ═════════════════════════════════════════════════════════════
//  STAFF DIRECTORY
// ═════════════════════════════════════════════════════════════

/** Admin-office staff (non-teaching). Teachers live on `/teachers`. */
export async function listStaffDirectory(actor: Actor) {
  requireAdmin(actor)

  // Both kinds of employee appear here — office staff *and* teachers. Callers
  // (leave requests, payroll) need to pick either, and `type` is what tells them
  // which foreign key an id belongs to.
  const [staff, teachers] = await Promise.all([
    prisma.staff.findMany({
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        employeeNo: true,
        name: true,
        designation: true,
        department: true,
        email: true,
        phone: true,
        employmentType: true,
        baseSalary: true,
        status: true,
        joiningDate: true,
      },
    }),
    prisma.teacher.findMany({
      orderBy: [{ status: 'asc' }, { user: { name: 'asc' } }],
      select: {
        id: true,
        employeeNo: true,
        department: true,
        designation: true,
        employmentType: true,
        baseSalary: true,
        status: true,
        joiningDate: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    }),
  ])

  const staffRows = staff.map((row) => ({
    id: row.id,
    type: 'staff' as const,
    employeeNo: row.employeeNo,
    name: row.name,
    position: row.designation,
    department: row.department,
    email: row.email,
    phone: row.phone,
    employmentType: row.employmentType,
    baseSalary: money(row.baseSalary),
    status: row.status,
    joiningDate: row.joiningDate.toISOString(),
  }))

  const teacherRows = teachers.map((row) => ({
    id: row.id,
    type: 'teacher' as const,
    employeeNo: row.employeeNo,
    name: row.user.name,
    position: row.designation,
    department: row.department,
    email: row.user.email,
    phone: row.user.phone,
    employmentType: row.employmentType,
    baseSalary: money(row.baseSalary),
    status: row.status,
    joiningDate: row.joiningDate.toISOString(),
  }))

  return [...staffRows, ...teacherRows].sort((a, b) => a.name.localeCompare(b.name))
}

// ═════════════════════════════════════════════════════════════
//  SCHOOL SETTINGS
// ═════════════════════════════════════════════════════════════

const SETTING_KEYS = [
  'school.name',
  'school.address',
  'school.phone',
  'school.email',
  'school.principal',
  'academic.currentTerm',
  'finance.currency',
  'finance.lateFeePercent',
  'attendance.warningThreshold',
  'notifications.emailEnabled',
] as const

export async function listSettings(actor: Actor) {
  requireAdmin(actor)

  const stored = await prisma.schoolSetting.findMany({ orderBy: { key: 'asc' } })
  const known = new Set(stored.map((entry) => entry.key))
  const defaults = await settingsDefaults()

  return SETTING_KEYS.map((key) => {
    const row = stored.find((entry) => entry.key === key)
    return {
      key,
      value: row?.value ?? defaults[key] ?? '',
      source: known.has(key) ? ('database' as const) : ('default' as const),
      updatedAt: row?.updatedAt.toISOString() ?? null,
    }
  })
}

async function settingsDefaults(): Promise<Record<string, string>> {
  const year = await prisma.academicYear.findFirst({
    where: { isCurrent: true },
    select: { name: true },
  })
  return {
    'school.name': 'Ravi School',
    'finance.currency': 'PKR',
    'finance.lateFeePercent': '2',
    'attendance.warningThreshold': '75',
    'notifications.emailEnabled': 'true',
    'academic.currentTerm': year?.name ?? '',
  }
}

export async function updateSettings(actor: Actor, updates: { key: string; value: string }[]) {
  requireAdmin(actor)

  const allowed = new Set<string>(SETTING_KEYS)
  const invalid = updates.filter((entry) => !allowed.has(entry.key))
  if (invalid.length > 0) {
    throw badRequest(`Unknown setting key(s): ${invalid.map((entry) => entry.key).join(', ')}`)
  }

  await prisma.$transaction(
    updates.map((entry) =>
      prisma.schoolSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      }),
    ),
  )

  await audit(actor.id, 'settings.update', 'SchoolSetting', undefined, { keys: updates.map((e) => e.key) })

  return listSettings(actor)
}

// ═════════════════════════════════════════════════════════════
//  SYSTEM ALERTS
// ═════════════════════════════════════════════════════════════

export interface SystemAlert {
  id: string
  title: string
  message: string
  severity: 'critical' | 'warning' | 'info'
  count: number
  href: string
}

/**
 * Alerts are derived on read from live tables — nothing is stored, so they
 * clear themselves the moment the underlying condition is resolved.
 */
export async function systemAlerts(actor: Actor) {
  requireAdmin(actor)

  const thresholdSetting = await prisma.schoolSetting.findUnique({
    where: { key: 'attendance.warningThreshold' },
    select: { value: true },
  })
  const threshold = Number(thresholdSetting?.value ?? 75) || 75

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const inSevenDays = new Date(startOfToday.getTime() + 7 * 86_400_000)

  const [
    overdueInvoices,
    partialWithBalance,
    lowAttendance,
    lowStock,
    pendingLeaves,
    overdueLoans,
    upcomingExams,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] }, dueDate: { lt: startOfToday } },
      _count: { _all: true },
      _sum: { amount: true, paidAmount: true },
    }),
    prisma.invoice.count({ where: { status: 'PARTIAL', dueDate: { lt: startOfToday } } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT "studentId",
               COUNT(*) FILTER (WHERE status = 'PRESENT' OR status = 'LATE')::float
                 / NULLIF(COUNT(*), 0) * 100 AS pct
        FROM attendance
        GROUP BY "studentId"
      ) t WHERE t.pct IS NOT NULL AND t.pct < ${threshold}
    `,
    prisma.inventoryItem.findMany({ select: { quantity: true, minQuantity: true } }),
    prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    prisma.bookIssue.count({ where: { status: { in: ['ISSUED', 'OVERDUE'] }, dueDate: { lt: startOfToday } } }),
    prisma.exam.count({ where: { examDate: { gte: startOfToday, lte: inSevenDays } } }),
  ])

  const balance = Number(overdueInvoices._sum.amount ?? 0) - Number(overdueInvoices._sum.paidAmount ?? 0)
  const lowStockCount = lowStock.filter((item) => item.quantity <= item.minQuantity).length
  const belowThreshold = Number(lowAttendance[0]?.count ?? 0)

  const alerts: SystemAlert[] = []

  if (overdueInvoices._count._all > 0) {
    alerts.push({
      id: 'fees-overdue',
      title: 'Overdue fee payments',
      message: `${overdueInvoices._count._all} invoice(s) past due — PKR ${Math.round(balance).toLocaleString()} outstanding${partialWithBalance > 0 ? ` (${partialWithBalance} part-paid)` : ''}`,
      severity: balance > 200_000 ? 'critical' : 'warning',
      count: overdueInvoices._count._all,
      href: '/admin/fees',
    })
  }

  if (belowThreshold > 0) {
    alerts.push({
      id: 'attendance-low',
      title: 'Low attendance',
      message: `${belowThreshold} student(s) are below the ${threshold}% attendance threshold`,
      severity: belowThreshold > 15 ? 'critical' : 'warning',
      count: belowThreshold,
      href: '/admin/reports',
    })
  }

  if (overdueLoans > 0) {
    alerts.push({
      id: 'library-overdue',
      title: 'Library books overdue',
      message: `${overdueLoans} loan(s) are past their due date`,
      severity: 'warning',
      count: overdueLoans,
      href: '/admin/library',
    })
  }

  if (lowStockCount > 0) {
    alerts.push({
      id: 'inventory-low',
      title: 'Low stock items',
      message: `${lowStockCount} inventory item(s) at or below their minimum quantity`,
      severity: 'warning',
      count: lowStockCount,
      href: '/admin/inventory',
    })
  }

  if (pendingLeaves > 0) {
    alerts.push({
      id: 'leave-pending',
      title: 'Leave requests awaiting approval',
      message: `${pendingLeaves} leave request(s) need a decision`,
      severity: 'info',
      count: pendingLeaves,
      href: '/admin/hr',
    })
  }

  if (upcomingExams > 0) {
    alerts.push({
      id: 'exams-upcoming',
      title: 'Exams this week',
      message: `${upcomingExams} exam(s) scheduled in the next 7 days`,
      severity: 'info',
      count: upcomingExams,
      href: '/admin/exams',
    })
  }

  const order = { critical: 0, warning: 1, info: 2 } as const
  alerts.sort((a, b) => order[a.severity] - order[b.severity])

  return {
    alerts,
    summary: {
      critical: alerts.filter((alert) => alert.severity === 'critical').length,
      warning: alerts.filter((alert) => alert.severity === 'warning').length,
      info: alerts.filter((alert) => alert.severity === 'info').length,
    },
    generatedAt: new Date().toISOString(),
  }
}
