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

// ═════════════════════════════════════════════════════════════
//  TRANSPORT — write paths
// ═════════════════════════════════════════════════════════════

export interface VehicleInput {
  registrationNo: string
  model: string
  capacity: number
  driverName: string
  driverPhone: string
  conductorName?: string | null
  status?: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'
  lastServiceAt?: string | null
}

export async function createVehicle(actor: Actor, input: VehicleInput) {
  requireAdmin(actor)
  const vehicle = await prisma.vehicle.create({
    data: {
      registrationNo: input.registrationNo.trim().toUpperCase(),
      model: input.model.trim(),
      capacity: input.capacity,
      driverName: input.driverName.trim(),
      driverPhone: input.driverPhone.trim(),
      conductorName: input.conductorName?.trim() || null,
      status: input.status ?? 'ACTIVE',
      lastServiceAt: input.lastServiceAt ? new Date(input.lastServiceAt) : null,
    },
    select: { id: true },
  })
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: 'transport.vehicle_create',
      entity: 'Vehicle',
      entityId: vehicle.id,
      metadata: { registrationNo: input.registrationNo },
    },
  })
  return { id: vehicle.id }
}

export async function updateVehicle(actor: Actor, id: string, input: Partial<VehicleInput>) {
  requireAdmin(actor)
  const existing = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw notFound('Vehicle')

  // A vehicle carries one route at a time in this model, so the cap that matters
  // is that route's rider count — shrinking below it would silently overbook.
  if (input.capacity !== undefined) {
    const assigned = await prisma.transportRoute.findMany({
      where: { vehicleId: id },
      select: { name: true, _count: { select: { students: true } } },
    })
    const busiest = assigned.reduce(
      (worst, route) => (route._count.students > (worst?._count.students ?? 0) ? route : worst),
      assigned[0],
    )
    if (busiest && busiest._count.students > input.capacity) {
      throw badRequest(
        `Capacity ${input.capacity} is below the ${busiest._count.students} riders already on ${busiest.name}`,
      )
    }
  }

  await prisma.vehicle.update({
    where: { id },
    data: {
      ...(input.registrationNo ? { registrationNo: input.registrationNo.trim().toUpperCase() } : {}),
      ...(input.model ? { model: input.model.trim() } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.driverName ? { driverName: input.driverName.trim() } : {}),
      ...(input.driverPhone ? { driverPhone: input.driverPhone.trim() } : {}),
      ...(input.conductorName !== undefined ? { conductorName: input.conductorName?.trim() || null } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.lastServiceAt !== undefined
        ? { lastServiceAt: input.lastServiceAt ? new Date(input.lastServiceAt) : null }
        : {}),
    },
  })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'transport.vehicle_update', entity: 'Vehicle', entityId: id },
  })
  return { id }
}

export async function deleteVehicle(actor: Actor, id: string) {
  requireAdmin(actor)
  const routeCount = await prisma.transportRoute.count({ where: { vehicleId: id } })
  if (routeCount > 0) {
    throw badRequest(`This vehicle is assigned to ${routeCount} route(s) — unassign it first`)
  }
  await prisma.vehicle.delete({ where: { id } })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'transport.vehicle_delete', entity: 'Vehicle', entityId: id },
  })
  return { deleted: true }
}

export interface RouteInput {
  name: string
  startPoint: string
  endPoint: string
  distanceKm?: number
  monthlyFee?: number
  vehicleId?: string | null
  isActive?: boolean
}

export async function createRoute(actor: Actor, input: RouteInput) {
  requireAdmin(actor)
  if (input.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: input.vehicleId },
      select: { id: true },
    })
    if (!vehicle) throw badRequest('Vehicle not found')
  }

  const route = await prisma.transportRoute.create({
    data: {
      name: input.name.trim(),
      startPoint: input.startPoint.trim(),
      endPoint: input.endPoint.trim(),
      distanceKm: input.distanceKm ?? 0,
      monthlyFee: input.monthlyFee ?? 0,
      vehicleId: input.vehicleId || null,
      isActive: input.isActive ?? true,
    },
    select: { id: true },
  })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'transport.route_create', entity: 'TransportRoute', entityId: route.id },
  })
  return { id: route.id }
}

export async function updateRoute(actor: Actor, id: string, input: Partial<RouteInput>) {
  requireAdmin(actor)
  const existing = await prisma.transportRoute.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw notFound('Route')

  await prisma.transportRoute.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.startPoint ? { startPoint: input.startPoint.trim() } : {}),
      ...(input.endPoint ? { endPoint: input.endPoint.trim() } : {}),
      ...(input.distanceKm !== undefined ? { distanceKm: input.distanceKm } : {}),
      ...(input.monthlyFee !== undefined ? { monthlyFee: input.monthlyFee } : {}),
      ...(input.vehicleId !== undefined ? { vehicleId: input.vehicleId || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'transport.route_update', entity: 'TransportRoute', entityId: id },
  })
  return { id }
}

export async function deleteRoute(actor: Actor, id: string) {
  requireAdmin(actor)
  const riders = await prisma.studentRoute.count({ where: { routeId: id } })
  if (riders > 0) {
    throw badRequest(`${riders} learner(s) are still assigned to this route — remove them first`)
  }
  await prisma.transportRoute.delete({ where: { id } })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'transport.route_delete', entity: 'TransportRoute', entityId: id },
  })
  return { deleted: true }
}

/** Seats are finite: a route can never carry more learners than its vehicle holds. */
export async function assignStudentToRoute(
  actor: Actor,
  routeId: string,
  input: { studentId: string; stopName?: string | null },
) {
  requireAdmin(actor)

  const route = await prisma.transportRoute.findUnique({
    where: { id: routeId },
    select: {
      id: true,
      name: true,
      vehicle: { select: { capacity: true } },
      _count: { select: { students: true } },
    },
  })
  if (!route) throw notFound('Route')

  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { id: true, status: true },
  })
  if (!student) throw notFound('Student')
  if (student.status !== 'ACTIVE') throw badRequest('Only active learners can be assigned a route')

  if (route.vehicle && route._count.students >= route.vehicle.capacity) {
    throw badRequest(`${route.name} is full (${route.vehicle.capacity} seats)`)
  }

  const assignment = await prisma.studentRoute.create({
    data: { routeId, studentId: input.studentId, stopName: input.stopName?.trim() || null },
    select: { id: true },
  })
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: 'transport.assign',
      entity: 'StudentRoute',
      entityId: assignment.id,
      metadata: { routeId, studentId: input.studentId },
    },
  })
  return { id: assignment.id }
}

export async function removeStudentFromRoute(actor: Actor, assignmentId: string) {
  requireAdmin(actor)
  await prisma.studentRoute.delete({ where: { id: assignmentId } })
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: 'transport.unassign',
      entity: 'StudentRoute',
      entityId: assignmentId,
    },
  })
  return { deleted: true }
}

// ═════════════════════════════════════════════════════════════
//  HOSTEL — write paths
// ═════════════════════════════════════════════════════════════

export interface RoomInput {
  block: string
  roomNo: string
  type?: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORMITORY'
  capacity: number
  monthlyFee?: number
  status?: 'AVAILABLE' | 'FULL' | 'MAINTENANCE'
}

export async function createRoom(actor: Actor, input: RoomInput) {
  requireAdmin(actor)
  const room = await prisma.hostelRoom.create({
    data: {
      block: input.block.trim().toUpperCase(),
      roomNo: input.roomNo.trim(),
      type: input.type ?? 'DOUBLE',
      capacity: input.capacity,
      monthlyFee: input.monthlyFee ?? 0,
      status: input.status ?? 'AVAILABLE',
    },
    select: { id: true },
  })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'hostel.room_create', entity: 'HostelRoom', entityId: room.id },
  })
  return { id: room.id }
}

export async function updateRoom(actor: Actor, id: string, input: Partial<RoomInput>) {
  requireAdmin(actor)
  const room = await prisma.hostelRoom.findUnique({ where: { id }, select: { occupied: true } })
  if (!room) throw notFound('Room')

  if (input.capacity !== undefined && input.capacity < room.occupied) {
    throw badRequest(`Capacity ${input.capacity} is below the ${room.occupied} residents already in this room`)
  }

  await prisma.hostelRoom.update({
    where: { id },
    data: {
      ...(input.block ? { block: input.block.trim().toUpperCase() } : {}),
      ...(input.roomNo ? { roomNo: input.roomNo.trim() } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.capacity !== undefined ? { capacity: input.capacity } : {}),
      ...(input.monthlyFee !== undefined ? { monthlyFee: input.monthlyFee } : {}),
      ...(input.status ? { status: input.status } : {}),
    },
  })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'hostel.room_update', entity: 'HostelRoom', entityId: id },
  })
  return { id }
}

export async function deleteRoom(actor: Actor, id: string) {
  requireAdmin(actor)
  const active = await prisma.hostelAllocation.count({ where: { roomId: id, isActive: true } })
  if (active > 0) throw badRequest(`${active} learner(s) still live in this room — vacate them first`)
  await prisma.hostelRoom.delete({ where: { id } })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'hostel.room_delete', entity: 'HostelRoom', entityId: id },
  })
  return { deleted: true }
}

/**
 * Allocation keeps `HostelRoom.occupied` in step with the allocations table.
 * Both are written in one transaction so a crash cannot leave the two disagreeing.
 */
export async function allocateRoom(actor: Actor, roomId: string, studentId: string) {
  requireAdmin(actor)

  return prisma.$transaction(async (tx) => {
    const room = await tx.hostelRoom.findUnique({
      where: { id: roomId },
      select: { id: true, capacity: true, occupied: true, status: true, block: true, roomNo: true },
    })
    if (!room) throw notFound('Room')
    if (room.status === 'MAINTENANCE') throw badRequest('This room is under maintenance')
    if (room.occupied >= room.capacity) throw badRequest(`Room ${room.block}-${room.roomNo} is full`)

    const student = await tx.student.findUnique({
      where: { id: studentId },
      select: { id: true, status: true },
    })
    if (!student) throw notFound('Student')
    if (student.status !== 'ACTIVE') throw badRequest('Only active learners can be allocated a room')

    const already = await tx.hostelAllocation.findFirst({
      where: { studentId, isActive: true },
      select: { id: true },
    })
    if (already) throw badRequest('This learner already has a hostel room')

    const allocation = await tx.hostelAllocation.create({
      data: { roomId, studentId },
      select: { id: true },
    })

    const occupied = room.occupied + 1
    await tx.hostelRoom.update({
      where: { id: roomId },
      data: { occupied, status: occupied >= room.capacity ? 'FULL' : 'AVAILABLE' },
    })

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: 'hostel.allocate',
        entity: 'HostelAllocation',
        entityId: allocation.id,
        metadata: { roomId, studentId },
      },
    })

    return { id: allocation.id, occupied, capacity: room.capacity }
  })
}

export async function vacateRoom(actor: Actor, allocationId: string) {
  requireAdmin(actor)

  return prisma.$transaction(async (tx) => {
    const allocation = await tx.hostelAllocation.findUnique({
      where: { id: allocationId },
      select: { id: true, roomId: true, isActive: true },
    })
    if (!allocation) throw notFound('Allocation')
    if (!allocation.isActive) throw badRequest('This allocation is already closed')

    await tx.hostelAllocation.update({
      where: { id: allocationId },
      data: { isActive: false, vacatedAt: new Date() },
    })

    const room = await tx.hostelRoom.update({
      where: { id: allocation.roomId },
      data: { occupied: { decrement: 1 } },
      select: { occupied: true, capacity: true, status: true },
    })

    // A vacated bed reopens the room unless it is deliberately out of service.
    if (room.status === 'FULL' && room.occupied < room.capacity) {
      await tx.hostelRoom.update({ where: { id: allocation.roomId }, data: { status: 'AVAILABLE' } })
    }

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: 'hostel.vacate',
        entity: 'HostelAllocation',
        entityId: allocationId,
      },
    })

    return { vacated: true, occupied: room.occupied }
  })
}

// ═════════════════════════════════════════════════════════════
//  INVENTORY — write paths
// ═════════════════════════════════════════════════════════════

export interface ItemInput {
  name: string
  code: string
  category: string
  quantity?: number
  minQuantity?: number
  unitPrice?: number
  location?: string | null
  supplier?: string | null
  condition?: 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED'
  purchasedAt?: string | null
}

export async function createItem(actor: Actor, input: ItemInput) {
  requireAdmin(actor)
  const item = await prisma.inventoryItem.create({
    data: {
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      category: input.category.trim(),
      quantity: input.quantity ?? 0,
      minQuantity: input.minQuantity ?? 0,
      unitPrice: input.unitPrice ?? 0,
      location: input.location?.trim() || null,
      supplier: input.supplier?.trim() || null,
      condition: input.condition ?? 'NEW',
      purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null,
    },
    select: { id: true },
  })
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: 'inventory.item_create',
      entity: 'InventoryItem',
      entityId: item.id,
      metadata: { code: input.code },
    },
  })
  return { id: item.id }
}

export async function updateItem(actor: Actor, id: string, input: Partial<ItemInput>) {
  requireAdmin(actor)
  const existing = await prisma.inventoryItem.findUnique({ where: { id }, select: { id: true } })
  if (!existing) throw notFound('Item')

  await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.code ? { code: input.code.trim().toUpperCase() } : {}),
      ...(input.category ? { category: input.category.trim() } : {}),
      ...(input.quantity !== undefined ? { quantity: input.quantity } : {}),
      ...(input.minQuantity !== undefined ? { minQuantity: input.minQuantity } : {}),
      ...(input.unitPrice !== undefined ? { unitPrice: input.unitPrice } : {}),
      ...(input.location !== undefined ? { location: input.location?.trim() || null } : {}),
      ...(input.supplier !== undefined ? { supplier: input.supplier?.trim() || null } : {}),
      ...(input.condition ? { condition: input.condition } : {}),
      ...(input.purchasedAt !== undefined
        ? { purchasedAt: input.purchasedAt ? new Date(input.purchasedAt) : null }
        : {}),
    },
  })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'inventory.item_update', entity: 'InventoryItem', entityId: id },
  })
  return { id }
}

export async function deleteItem(actor: Actor, id: string) {
  requireAdmin(actor)
  await prisma.inventoryItem.delete({ where: { id } })
  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'inventory.item_delete', entity: 'InventoryItem', entityId: id },
  })
  return { deleted: true }
}

/**
 * Stock movement. Kept separate from `updateItem` because a correction needs a
 * reason on the audit trail — "who wrote off 12 chairs and why" is a real
 * question at stock-take.
 */
export async function adjustStock(
  actor: Actor,
  id: string,
  input: { delta: number; reason: string },
) {
  requireAdmin(actor)

  return prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({
      where: { id },
      select: { id: true, name: true, quantity: true },
    })
    if (!item) throw notFound('Item')

    const next = item.quantity + input.delta
    if (next < 0) {
      throw badRequest(`Only ${item.quantity} in stock — cannot remove ${Math.abs(input.delta)}`)
    }

    const updated = await tx.inventoryItem.update({
      where: { id },
      data: { quantity: next },
      select: { quantity: true, minQuantity: true },
    })

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: 'inventory.stock_adjust',
        entity: 'InventoryItem',
        entityId: id,
        metadata: { delta: input.delta, reason: input.reason, before: item.quantity, after: next },
      },
    })

    return {
      quantity: updated.quantity,
      lowStock: updated.quantity <= updated.minQuantity,
    }
  })
}

// ═════════════════════════════════════════════════════════════
//  HR — payroll runs + leave workflow
// ═════════════════════════════════════════════════════════════

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Drafts payroll for a period from each person's current salary.
 *
 * Idempotent per (person, period): re-running after new joiners is safe because
 * `createMany({ skipDuplicates })` leaves existing rows — and therefore any
 * allowances or deductions already entered — untouched.
 */
export async function runPayroll(actor: Actor, period: string) {
  requireAdmin(actor)
  if (!PERIOD.test(period)) throw badRequest('Period must look like 2026-01')

  const [teachers, staff] = await Promise.all([
    prisma.teacher.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, baseSalary: true },
    }),
    prisma.staff.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, baseSalary: true },
    }),
  ])

  const rows = [
    ...teachers.map((t) => ({
      teacherId: t.id,
      period,
      baseSalary: t.baseSalary,
      netPay: t.baseSalary,
    })),
    ...staff.map((s) => ({
      staffId: s.id,
      period,
      baseSalary: s.baseSalary,
      netPay: s.baseSalary,
    })),
  ]

  if (rows.length === 0) throw badRequest('No active staff to run payroll for')

  const result = await prisma.payroll.createMany({ data: rows, skipDuplicates: true })
  const total = await prisma.payroll.count({ where: { period } })

  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: 'hr.payroll_run',
      entity: 'Payroll',
      entityId: period,
      metadata: { created: result.count, total, period },
    },
  })

  return { period, created: result.count, skipped: rows.length - result.count, total }
}

/** Marks a whole period paid in one action — the common month-end case. */
export async function markPayrollPaid(actor: Actor, period: string) {
  requireAdmin(actor)
  if (!PERIOD.test(period)) throw badRequest('Period must look like 2026-01')

  const result = await prisma.payroll.updateMany({
    where: { period, status: { not: 'PAID' } },
    data: { status: 'PAID', paidAt: new Date(), processedById: actor.id },
  })

  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: 'hr.payroll_paid',
      entity: 'Payroll',
      entityId: period,
      metadata: { marked: result.count },
    },
  })

  return { period, marked: result.count }
}

export async function createLeaveRequest(
  actor: Actor,
  input: { teacherId?: string | null; staffId?: string | null; fromDate: string; toDate: string; reason: string },
) {
  requireAdmin(actor)

  if (!input.teacherId && !input.staffId) throw badRequest('Choose who the leave is for')
  if (new Date(input.toDate) < new Date(input.fromDate)) {
    throw badRequest('The end date cannot be before the start date')
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      teacherId: input.teacherId || null,
      staffId: input.staffId || null,
      fromDate: new Date(input.fromDate),
      toDate: new Date(input.toDate),
      reason: input.reason.trim(),
      status: 'PENDING',
    },
    select: { id: true },
  })

  await prisma.auditLog.create({
    data: { userId: actor.id, action: 'hr.leave_create', entity: 'LeaveRequest', entityId: leave.id },
  })

  return { id: leave.id }
}

export async function decideLeave(actor: Actor, id: string, decision: 'APPROVED' | 'REJECTED') {
  requireAdmin(actor)

  const leave = await prisma.leaveRequest.findUnique({ where: { id }, select: { status: true } })
  if (!leave) throw notFound('Leave request')
  if (leave.status !== 'PENDING') throw badRequest(`This request is already ${leave.status.toLowerCase()}`)

  await prisma.leaveRequest.update({
    where: { id },
    data: { status: decision, approvedBy: actor.id },
  })

  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: decision === 'APPROVED' ? 'hr.leave_approve' : 'hr.leave_reject',
      entity: 'LeaveRequest',
      entityId: id,
    },
  })

  return { id, status: decision }
}
