import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, forbidden, notFound } from '../utils/errors.js'

/**
 * Operations: library, transport, hostel and inventory.
 *
 * Admins manage everything; teachers may read the library catalogue and their
 * own issues; learners/parents never reach these endpoints (they are staff
 * facing in this build).
 */

export interface Actor {
  id: string
  role: Role
}

function money(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  return Math.round(Number(value.toString()) * 100) / 100
}

function requireStaff(actor: Actor) {
  if (actor.role !== 'ADMIN' && actor.role !== 'TEACHER') {
    throw forbidden('Only staff can access this resource')
  }
}

function requireAdmin(actor: Actor) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can change this resource')
}

// ═════════════════════════════════════════════════════════════
//  LIBRARY
// ═════════════════════════════════════════════════════════════

export async function libraryOverview(actor: Actor) {
  requireStaff(actor)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [books, available, issues, overdue, categories] = await Promise.all([
    prisma.book.count(),
    prisma.book.aggregate({ _sum: { availableCopies: true, totalCopies: true } }),
    prisma.bookIssue.count({ where: { status: 'ISSUED' } }),
    prisma.bookIssue.count({ where: { status: 'OVERDUE' } }),
    prisma.book.groupBy({ by: ['category'], _count: { _all: true }, _sum: { totalCopies: true } }),
  ])

  return {
    titles: books,
    copies: available._sum.totalCopies ?? 0,
    availableCopies: available._sum.availableCopies ?? 0,
    onLoan: issues,
    overdue,
    categories: categories
      .map((row) => ({ name: row.category, titles: row._count._all, copies: row._sum.totalCopies ?? 0 }))
      .sort((a, b) => b.titles - a.titles),
  }
}

export async function listBooks(filters: { search?: string; category?: string; page: number; limit: number }) {
  const where: Prisma.BookWhereInput = {
    AND: [
      filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { author: { contains: filters.search, mode: 'insensitive' } },
              { isbn: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {},
      filters.category ? { category: filters.category } : {},
    ],
  }

  const [rows, total] = await prisma.$transaction([
    prisma.book.findMany({
      where,
      orderBy: { title: 'asc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        title: true,
        author: true,
        isbn: true,
        category: true,
        publisher: true,
        totalCopies: true,
        availableCopies: true,
        shelfNo: true,
        status: true,
      },
    }),
    prisma.book.count({ where }),
  ])

  return {
    items: rows,
    meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) || 1 },
  }
}

export async function listBookIssues(filters: { status?: string; search?: string; page: number; limit: number }) {
  const where: Prisma.BookIssueWhereInput = {
    AND: [
      filters.status ? { status: filters.status as never } : {},
      filters.search
        ? {
            OR: [
              { book: { title: { contains: filters.search, mode: 'insensitive' } } },
              { student: { user: { name: { contains: filters.search, mode: 'insensitive' } } } },
            ],
          }
        : {},
    ],
  }

  const [rows, total] = await prisma.$transaction([
    prisma.bookIssue.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        issuedAt: true,
        dueDate: true,
        returnedAt: true,
        status: true,
        fine: true,
        book: { select: { id: true, title: true, author: true } },
        student: {
          select: { id: true, admissionNo: true, user: { select: { name: true } } },
        },
      },
    }),
    prisma.bookIssue.count({ where }),
  ])

  return {
    items: rows.map((row) => ({
      id: row.id,
      bookTitle: row.book.title,
      bookAuthor: row.book.author,
      studentName: row.student.user.name,
      admissionNo: row.student.admissionNo,
      issuedAt: row.issuedAt.toISOString(),
      dueDate: row.dueDate.toISOString(),
      returnedAt: row.returnedAt?.toISOString() ?? null,
      status: row.status,
      fine: money(row.fine),
    })),
    meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) || 1 },
  }
}

export async function issueBook(actor: Actor, input: { bookId: string; studentId: string; dueDate: string }) {
  requireAdmin(actor)

  const [book, student] = await Promise.all([
    prisma.book.findUnique({ where: { id: input.bookId }, select: { id: true, availableCopies: true, title: true } }),
    prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } }),
  ])
  if (!book) throw notFound('Book')
  if (!student) throw notFound('Student')
  if (book.availableCopies <= 0) throw badRequest(`No copies of "${book.title}" are available`)

  const due = new Date(input.dueDate)
  if (Number.isNaN(due.getTime())) throw badRequest('Invalid due date')

  const issue = await prisma.$transaction(async (tx) => {
    const created = await tx.bookIssue.create({
      data: { bookId: book.id, studentId: student.id, dueDate: due, status: 'ISSUED' },
      select: { id: true },
    })
    await tx.book.update({ where: { id: book.id }, data: { availableCopies: { decrement: 1 } } })
    return created
  })

  return { id: issue.id }
}

export async function returnBook(actor: Actor, id: string, fine?: number) {
  requireAdmin(actor)

  const issue = await prisma.bookIssue.findUnique({
    where: { id },
    select: { id: true, bookId: true, status: true, returnedAt: true, fine: true },
  })
  if (!issue) throw notFound('Book issue')
  if (issue.status === 'RETURNED' || issue.returnedAt) throw badRequest('This copy has already been returned')

  await prisma.$transaction([
    prisma.bookIssue.update({
      where: { id },
      data: { status: 'RETURNED', returnedAt: new Date(), fine: fine ?? issue.fine },
    }),
    prisma.book.update({ where: { id: issue.bookId }, data: { availableCopies: { increment: 1 } } }),
  ])

  return { returned: true }
}

/** Marks ISSUED loans whose due date has passed as OVERDUE. */
export async function refreshOverdueLoans(actor: Actor) {
  requireAdmin(actor)

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const result = await prisma.bookIssue.updateMany({
    where: { status: 'ISSUED', dueDate: { lt: today } },
    data: { status: 'OVERDUE' },
  })

  return { updated: result.count }
}

// ═════════════════════════════════════════════════════════════
//  TRANSPORT
// ═════════════════════════════════════════════════════════════

export async function transportOverview(actor: Actor) {
  requireStaff(actor)

  const [routes, vehicles, allocations] = await Promise.all([
    prisma.transportRoute.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        startPoint: true,
        endPoint: true,
        distanceKm: true,
        monthlyFee: true,
        isActive: true,
        vehicle: {
          select: {
            id: true,
            registrationNo: true,
            model: true,
            capacity: true,
            driverName: true,
            driverPhone: true,
            status: true,
          },
        },
        _count: { select: { students: true } },
      },
    }),
    prisma.vehicle.findMany({
      orderBy: { registrationNo: 'asc' },
      select: { id: true, registrationNo: true, model: true, capacity: true, driverName: true, status: true },
    }),
    prisma.studentRoute.count(),
  ])

  return {
    routes: routes.map((route) => ({
      id: route.id,
      name: route.name,
      startPoint: route.startPoint,
      endPoint: route.endPoint,
      distanceKm: money(route.distanceKm),
      monthlyFee: money(route.monthlyFee),
      isActive: route.isActive,
      riders: route._count.students,
      vehicle: route.vehicle
        ? {
            id: route.vehicle.id,
            registrationNo: route.vehicle.registrationNo,
            model: route.vehicle.model,
            capacity: route.vehicle.capacity,
            driverName: route.vehicle.driverName,
            driverPhone: route.vehicle.driverPhone,
            status: route.vehicle.status,
          }
        : null,
    })),
    vehicles,
    riders: allocations,
    seats: vehicles.reduce((sum, vehicle) => sum + vehicle.capacity, 0),
  }
}

export async function listRouteRiders(actor: Actor, routeId: string) {
  requireStaff(actor)

  const riders = await prisma.studentRoute.findMany({
    where: { routeId },
    orderBy: { student: { user: { name: 'asc' } } },
    select: {
      id: true,
      stopName: true,
      student: {
        select: {
          id: true,
          admissionNo: true,
          user: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
    },
  })

  return riders.map((rider) => ({
    id: rider.id,
    stopName: rider.stopName,
    studentId: rider.student.id,
    studentName: rider.student.user.name,
    admissionNo: rider.student.admissionNo,
    className: rider.student.class?.name ?? null,
  }))
}

// ═════════════════════════════════════════════════════════════
//  HOSTEL
// ═════════════════════════════════════════════════════════════

export async function hostelOverview(actor: Actor) {
  requireStaff(actor)

  const [rooms, activeAllocations] = await Promise.all([
    prisma.hostelRoom.findMany({
      orderBy: [{ block: 'asc' }, { roomNo: 'asc' }],
      select: {
        id: true,
        block: true,
        roomNo: true,
        type: true,
        capacity: true,
        occupied: true,
        monthlyFee: true,
        status: true,
        allocations: {
          where: { isActive: true },
          select: {
            id: true,
            allocatedAt: true,
            student: {
              select: {
                id: true,
                admissionNo: true,
                user: { select: { name: true } },
                class: { select: { name: true } },
              },
            },
          },
        },
      },
    }),
    prisma.hostelAllocation.count({ where: { isActive: true } }),
  ])

  const beds = rooms.reduce((sum, room) => sum + room.capacity, 0)
  const occupied = rooms.reduce((sum, room) => sum + room.occupied, 0)

  return {
    beds,
    occupied,
    occupancyRate: beds === 0 ? null : Math.round((occupied / beds) * 1000) / 10,
    activeAllocations,
    monthlyRevenue: rooms.reduce((sum, room) => sum + money(room.monthlyFee) * room.occupied, 0),
    rooms: rooms.map((room) => ({
      id: room.id,
      block: room.block,
      roomNo: room.roomNo,
      type: room.type,
      capacity: room.capacity,
      occupied: room.occupied,
      monthlyFee: money(room.monthlyFee),
      status: room.status,
      residents: room.allocations.map((allocation) => ({
        allocationId: allocation.id,
        studentId: allocation.student.id,
        name: allocation.student.user.name,
        admissionNo: allocation.student.admissionNo,
        className: allocation.student.class?.name ?? null,
        allocatedAt: allocation.allocatedAt.toISOString(),
      })),
    })),
  }
}

// ═════════════════════════════════════════════════════════════
//  INVENTORY
// ═════════════════════════════════════════════════════════════

export async function inventoryOverview(actor: Actor) {
  requireStaff(actor)

  const items = await prisma.inventoryItem.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      code: true,
      category: true,
      quantity: true,
      minQuantity: true,
      unitPrice: true,
      location: true,
      supplier: true,
      condition: true,
      purchasedAt: true,
    },
  })

  const rows = items.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    category: item.category,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    unitPrice: money(item.unitPrice),
    value: Math.round(money(item.unitPrice) * item.quantity * 100) / 100,
    location: item.location,
    supplier: item.supplier,
    condition: item.condition,
    purchasedAt: item.purchasedAt?.toISOString() ?? null,
    lowStock: item.quantity <= item.minQuantity,
  }))

  const byCategory = new Map<string, { items: number; quantity: number; value: number }>()
  for (const row of rows) {
    const bucket = byCategory.get(row.category) ?? { items: 0, quantity: 0, value: 0 }
    bucket.items += 1
    bucket.quantity += row.quantity
    bucket.value += row.value
    byCategory.set(row.category, bucket)
  }

  return {
    items: rows,
    totalValue: Math.round(rows.reduce((sum, row) => sum + row.value, 0) * 100) / 100,
    lowStock: rows.filter((row) => row.lowStock).length,
    categories: [...byCategory.entries()]
      .map(([name, bucket]) => ({ name, ...bucket, value: Math.round(bucket.value * 100) / 100 }))
      .sort((a, b) => b.value - a.value),
  }
}

// ═════════════════════════════════════════════════════════════
//  HR / PAYROLL
// ═════════════════════════════════════════════════════════════

export interface PayrollRow {
  id: string
  period: string
  staffName: string
  employeeNo: string | null
  staffType: 'Teacher' | 'Staff'
  department: string | null
  baseSalary: number
  allowances: number
  deductions: number
  netPay: number
  status: string
  paidAt: string | null
}

export async function payrollOverview(actor: Actor, period?: string) {
  requireAdmin(actor)

  const periods = await prisma.payroll.findMany({
    distinct: ['period'],
    select: { period: true },
    orderBy: { period: 'desc' },
  })

  const activePeriod = period ?? periods[0]?.period ?? null

  const rows = activePeriod
    ? await prisma.payroll.findMany({
        where: { period: activePeriod },
        orderBy: [{ status: 'asc' }],
        select: {
          id: true,
          period: true,
          baseSalary: true,
          allowances: true,
          deductions: true,
          netPay: true,
          status: true,
          paidAt: true,
          teacher: {
            select: {
              employeeNo: true,
              department: true,
              user: { select: { name: true } },
            },
          },
          staff: { select: { employeeNo: true, department: true, name: true, designation: true } },
        },
      })
    : []

  const staffCount = await prisma.staff.count({ where: { status: 'ACTIVE' } })
  const teacherCount = await prisma.teacher.count({ where: { status: 'ACTIVE' } })
  const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } })

  const payrollRows: PayrollRow[] = rows.map((row) => ({
    id: row.id,
    period: row.period,
    staffName: row.teacher?.user.name ?? row.staff?.name ?? 'Unknown',
    employeeNo: row.teacher?.employeeNo ?? row.staff?.employeeNo ?? null,
    staffType: row.teacher ? 'Teacher' : 'Staff',
    department: row.teacher?.department ?? row.staff?.department ?? null,
    baseSalary: money(row.baseSalary),
    allowances: money(row.allowances),
    deductions: money(row.deductions),
    netPay: money(row.netPay),
    status: row.status,
    paidAt: row.paidAt?.toISOString() ?? null,
  }))

  return {
    periods: periods.map((entry) => entry.period),
    period: activePeriod,
    rows: payrollRows,
    totals: {
      net: Math.round(payrollRows.reduce((sum, row) => sum + row.netPay, 0) * 100) / 100,
      paid: Math.round(
        payrollRows.filter((row) => row.status === 'PAID').reduce((sum, row) => sum + row.netPay, 0) * 100,
      ) / 100,
      draft: payrollRows.filter((row) => row.status === 'DRAFT').length,
      headcount: payrollRows.length,
    },
    headcount: { staff: staffCount, teachers: teacherCount },
    pendingLeaves,
  }
}

export async function listLeaveRequests(actor: Actor) {
  requireAdmin(actor)

  const rows = await prisma.leaveRequest.findMany({
    orderBy: { fromDate: 'desc' },
    take: 50,
    select: {
      id: true,
      fromDate: true,
      toDate: true,
      reason: true,
      status: true,
      teacher: { select: { user: { select: { name: true } } } },
      staff: { select: { name: true } },
    },
  })

  return rows.map((row) => ({
    id: row.id,
    name: row.teacher?.user.name ?? row.staff?.name ?? 'Unknown',
    fromDate: row.fromDate.toISOString(),
    toDate: row.toDate.toISOString(),
    reason: row.reason,
    status: row.status,
  }))
}
