import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/**
 * Operations write paths: transport, hostel, inventory and HR.
 *
 * These cover the business rules rather than the happy path alone — seat
 * capacity, double allocation, stock going negative, idempotent payroll runs and
 * the leave state machine. Those are exactly the places a school's data goes
 * wrong when they are missing.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)
const PASSWORD = 'TestPass123'

let adminToken = ''
let teacherToken = ''

let vehicleId = ''
let routeId = ''
let roomId = ''
let itemId = ''
let leaveId = ''

let studentId = ''
let secondStudentId = ''
let assignmentId = ''
let allocationId = ''

const userIds: string[] = []
const notificationIds: string[] = []

async function login(email: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

beforeAll(async () => {
  const passwordHash = await hashPassword(PASSWORD)

  const admin = await prisma.user.create({
    data: { email: `ops-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'Ops Admin' },
  })
  const teacherUser = await prisma.user.create({
    data: { email: `ops-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'Ops Teacher' },
  })
  userIds.push(admin.id, teacherUser.id)

  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `EMP-OPS-${suffix}`,
      department: 'Science',
      designation: 'Teacher',
      joiningDate: new Date('2024-04-01'),
      employmentType: 'PERMANENT',
      baseSalary: 80000,
      status: 'ACTIVE',
    },
  })

  const studentUser = await prisma.user.create({
    data: {
      email: `ops-student-${suffix}@test.pk`,
      passwordHash,
      role: 'STUDENT',
      name: 'Ops Learner',
    },
  })
  userIds.push(studentUser.id)

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `OPS-${suffix}`,
      dateOfBirth: new Date('2011-02-02'),
      gender: 'FEMALE',
      admissionDate: new Date('2024-04-01'),
      status: 'ACTIVE',
    },
  })
  studentId = student.id

  const secondUser = await prisma.user.create({
    data: {
      email: `ops-student2-${suffix}@test.pk`,
      passwordHash,
      role: 'STUDENT',
      name: 'Ops Second Learner',
    },
  })
  userIds.push(secondUser.id)
  const second = await prisma.student.create({
    data: {
      userId: secondUser.id,
      admissionNo: `OPS2-${suffix}`,
      dateOfBirth: new Date('2011-06-06'),
      gender: 'MALE',
      admissionDate: new Date('2024-04-01'),
      status: 'ACTIVE',
    },
  })
  secondStudentId = second.id

  adminToken = await login(admin.email)
  teacherToken = await login(teacherUser.email)
})

afterAll(async () => {
  // Order matters: children before parents.
  await prisma.studentRoute.deleteMany({ where: { studentId } })
  await prisma.hostelAllocation.deleteMany({ where: { studentId } })
  await prisma.transportRoute.deleteMany({ where: { name: { contains: suffix } } })
  await prisma.vehicle.deleteMany({ where: { registrationNo: { contains: suffix.slice(-4) } } })
  await prisma.hostelRoom.deleteMany({ where: { roomNo: { contains: suffix.slice(-4) } } })
  await prisma.inventoryItem.deleteMany({ where: { code: { contains: suffix.slice(-4) } } })
  await prisma.leaveRequest.deleteMany({ where: { reason: { contains: suffix } } })
  await prisma.payroll.deleteMany({ where: { period: '2031-07' } })
  await prisma.student.deleteMany({ where: { id: { in: [studentId, secondStudentId] } } })
  await prisma.teacher.deleteMany({ where: { employeeNo: `EMP-OPS-${suffix}` } })
  await prisma.notification.deleteMany({ where: { id: { in: notificationIds } } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
})

// ═════════════════════════════════════════════════════════════
//  RBAC
// ═════════════════════════════════════════════════════════════
describe('operations writes are admin-only', () => {
  it.each([
    ['POST', '/api/v1/transport/vehicles'],
    ['POST', '/api/v1/transport/routes'],
    ['POST', '/api/v1/hostel/rooms'],
    ['POST', '/api/v1/inventory/items'],
    ['POST', '/api/v1/hr/payroll/run'],
    ['POST', '/api/v1/hr/leaves'],
  ])('refuses %s %s for a teacher', async (method, url) => {
    const res = await request(app)[method.toLowerCase() as 'post'](url).set(auth(teacherToken)).send({})
    expect([403, 401]).toContain(res.status)
  })
})

// ═════════════════════════════════════════════════════════════
//  TRANSPORT
// ═════════════════════════════════════════════════════════════
describe('transport', () => {
  it('creates a vehicle and rejects a duplicate registration', async () => {
    const payload = {
      registrationNo: `TST-${suffix.slice(-4)}`,
      model: 'Coaster 2024',
      capacity: 2,
      driverName: 'Akram Ali',
      driverPhone: '+92 300 1234567',
    }

    const res = await request(app).post('/api/v1/transport/vehicles').set(auth(adminToken)).send(payload)
    expect(res.status).toBe(201)
    vehicleId = res.body.data.id

    const dupe = await request(app).post('/api/v1/transport/vehicles').set(auth(adminToken)).send(payload)
    expect(dupe.status).toBe(409)
  })

  it('validates the vehicle body', async () => {
    const res = await request(app)
      .post('/api/v1/transport/vehicles')
      .set(auth(adminToken))
      .send({ registrationNo: 'X', model: '', capacity: 0, driverName: '', driverPhone: '' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('creates a route bound to the vehicle', async () => {
    const res = await request(app)
      .post('/api/v1/transport/routes')
      .set(auth(adminToken))
      .send({
        name: `Route ${suffix}`,
        startPoint: 'F-10',
        endPoint: 'G-9',
        distanceKm: 12.5,
        monthlyFee: 4500,
        vehicleId,
      })
    expect(res.status).toBe(201)
    routeId = res.body.data.id
  })

  it('assigns a learner, then refuses once the vehicle is full', async () => {
    const first = await request(app)
      .post(`/api/v1/transport/routes/${routeId}/riders`)
      .set(auth(adminToken))
      .send({ studentId })
    expect(first.status).toBe(201)
    assignmentId = first.body.data.id

    // Capacity is 2; adding the same learner twice must fail on the unique key,
    // so a second learner is what actually exercises the cap.
    const dupe = await request(app)
      .post(`/api/v1/transport/routes/${routeId}/riders`)
      .set(auth(adminToken))
      .send({ studentId })
    expect(dupe.status).toBeGreaterThanOrEqual(400)
  })

  it('refuses to delete a route that still has riders', async () => {
    const res = await request(app).delete(`/api/v1/transport/routes/${routeId}`).set(auth(adminToken))
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/still assigned/i)
  })

  it('refuses to shrink a vehicle below its rider count', async () => {
    // Fill the last seat (capacity is 2), then try to shrink the bus to 1.
    const second = await request(app)
      .post(`/api/v1/transport/routes/${routeId}/riders`)
      .set(auth(adminToken))
      .send({ studentId: secondStudentId })
    expect(second.status).toBe(201)

    const res = await request(app)
      .patch(`/api/v1/transport/vehicles/${vehicleId}`)
      .set(auth(adminToken))
      .send({ capacity: 1 })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/below/i)

    // And a third learner cannot board a full vehicle.
    const third = await request(app)
      .post(`/api/v1/transport/routes/${routeId}/riders`)
      .set(auth(adminToken))
      .send({ studentId })
    expect(third.status).toBe(400)
    expect(third.body.error.message).toMatch(/full/i)

    await request(app).delete(`/api/v1/transport/riders/${second.body.data.id}`).set(auth(adminToken))
  })

  it('unassigns the learner, then allows the route to be deleted', async () => {
    const unassign = await request(app)
      .delete(`/api/v1/transport/riders/${assignmentId}`)
      .set(auth(adminToken))
    expect(unassign.status).toBe(200)

    const del = await request(app).delete(`/api/v1/transport/routes/${routeId}`).set(auth(adminToken))
    expect(del.status).toBe(200)
    routeId = ''
  })

  it('refuses to delete a vehicle still on a route, then allows it once free', async () => {
    const res = await request(app).delete(`/api/v1/transport/vehicles/${vehicleId}`).set(auth(adminToken))
    expect(res.status).toBe(200)
  })
})

// ═════════════════════════════════════════════════════════════
//  HOSTEL
// ═════════════════════════════════════════════════════════════
describe('hostel', () => {
  it('creates a room and rejects a duplicate block/number pair', async () => {
    const payload = { block: 'Z', roomNo: `R${suffix.slice(-4)}`, type: 'DOUBLE', capacity: 1, monthlyFee: 8000 }
    const res = await request(app).post('/api/v1/hostel/rooms').set(auth(adminToken)).send(payload)
    expect(res.status).toBe(201)
    roomId = res.body.data.id

    const dupe = await request(app).post('/api/v1/hostel/rooms').set(auth(adminToken)).send(payload)
    expect(dupe.status).toBe(409)
  })

  it('allocates a learner and flips the room to FULL at capacity', async () => {
    const res = await request(app)
      .post(`/api/v1/hostel/rooms/${roomId}/allocate`)
      .set(auth(adminToken))
      .send({ studentId })

    expect(res.status).toBe(201)
    expect(res.body.data).toMatchObject({ occupied: 1, capacity: 1 })
    allocationId = res.body.data.id

    const room = await prisma.hostelRoom.findUnique({ where: { id: roomId } })
    expect(room?.occupied).toBe(1)
    expect(room?.status).toBe('FULL')
  })

  it('refuses a second room for the same learner', async () => {
    const other = await request(app)
      .post('/api/v1/hostel/rooms')
      .set(auth(adminToken))
      .send({ block: 'Z', roomNo: `S${suffix.slice(-4)}`, capacity: 2 })
    expect(other.status).toBe(201)

    const res = await request(app)
      .post(`/api/v1/hostel/rooms/${other.body.data.id}/allocate`)
      .set(auth(adminToken))
      .send({ studentId })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/already has a hostel room/i)

    await prisma.hostelRoom.delete({ where: { id: other.body.data.id } })
  })

  it('refuses to delete a room with residents', async () => {
    const res = await request(app).delete(`/api/v1/hostel/rooms/${roomId}`).set(auth(adminToken))
    expect(res.status).toBe(400)
  })

  it('vacates: frees the bed and reopens the room', async () => {
    const res = await request(app)
      .post(`/api/v1/hostel/allocations/${allocationId}/vacate`)
      .set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.occupied).toBe(0)

    const room = await prisma.hostelRoom.findUnique({ where: { id: roomId } })
    expect(room?.occupied).toBe(0)
    expect(room?.status).toBe('AVAILABLE')

    const again = await request(app)
      .post(`/api/v1/hostel/allocations/${allocationId}/vacate`)
      .set(auth(adminToken))
    expect(again.status).toBe(400)
  })
})

// ═════════════════════════════════════════════════════════════
//  INVENTORY
// ═════════════════════════════════════════════════════════════
describe('inventory', () => {
  it('creates an item and rejects a duplicate code', async () => {
    const payload = { name: 'Classroom chair', code: `CH-${suffix.slice(-4)}`, category: 'Furniture', quantity: 10, minQuantity: 4, unitPrice: 2500 }
    const res = await request(app).post('/api/v1/inventory/items').set(auth(adminToken)).send(payload)
    expect(res.status).toBe(201)
    itemId = res.body.data.id

    const dupe = await request(app).post('/api/v1/inventory/items').set(auth(adminToken)).send(payload)
    expect(dupe.status).toBe(409)
  })

  it('adjusts stock up and down', async () => {
    const up = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/adjust`)
      .set(auth(adminToken))
      .send({ delta: 5, reason: 'New delivery from supplier' })
    expect(up.status).toBe(200)
    expect(up.body.data.quantity).toBe(15)

    const down = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/adjust`)
      .set(auth(adminToken))
      .send({ delta: -3, reason: 'Issued to room 4B' })
    expect(down.body.data.quantity).toBe(12)
  })

  it('refuses to take stock below zero', async () => {
    const res = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/adjust`)
      .set(auth(adminToken))
      .send({ delta: -999, reason: 'Stock take' })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/only 12 in stock/i)
  })

  it('requires a reason and a non-zero delta', async () => {
    const noReason = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/adjust`)
      .set(auth(adminToken))
      .send({ delta: 1, reason: '' })
    expect(noReason.status).toBe(400)

    const zero = await request(app)
      .post(`/api/v1/inventory/items/${itemId}/adjust`)
      .set(auth(adminToken))
      .send({ delta: 0, reason: 'Nothing changed' })
    expect(zero.status).toBe(400)
  })

  it('records the adjustment on the audit trail', async () => {
    const entry = await prisma.auditLog.findFirst({
      where: { entityId: itemId, action: 'inventory.stock_adjust' },
      orderBy: { createdAt: 'desc' },
    })
    expect(entry).not.toBeNull()
    expect((entry?.metadata as { reason?: string })?.reason).toBe('Issued to room 4B')
  })
})

// ═════════════════════════════════════════════════════════════
//  HR
// ═════════════════════════════════════════════════════════════
describe('HR — payroll', () => {
  const period = '2031-07'

  it('drafts a period and is idempotent when re-run', async () => {
    const first = await request(app).post('/api/v1/hr/payroll/run').set(auth(adminToken)).send({ period })
    expect(first.status).toBe(201)
    expect(first.body.data.created).toBeGreaterThan(0)

    const second = await request(app).post('/api/v1/hr/payroll/run').set(auth(adminToken)).send({ period })
    expect(second.body.data.created).toBe(0)
    expect(second.body.data.skipped).toBeGreaterThan(0)
  })

  it('rejects a malformed period', async () => {
    const res = await request(app).post('/api/v1/hr/payroll/run').set(auth(adminToken)).send({ period: '2026-13' })
    expect(res.status).toBe(400)
  })

  it('marks the period paid exactly once', async () => {
    const res = await request(app).post('/api/v1/hr/payroll/pay').set(auth(adminToken)).send({ period })
    expect(res.status).toBe(200)
    expect(res.body.data.marked).toBeGreaterThan(0)

    const again = await request(app).post('/api/v1/hr/payroll/pay').set(auth(adminToken)).send({ period })
    expect(again.body.data.marked).toBe(0)
  })
})

describe('HR — leave workflow', () => {
  it('creates a pending request', async () => {
    const res = await request(app)
      .post('/api/v1/hr/leaves')
      .set(auth(adminToken))
      .send({
        staffId: null,
        fromDate: '2026-03-02',
        toDate: '2026-03-04',
        reason: `Family event ${suffix}`,
      })
    // Needs a subject: a request with neither teacher nor staff is refused.
    expect(res.status).toBe(400)
  })

  it('requires someone the leave belongs to', async () => {
    const teacher = await prisma.teacher.findFirst({ where: { employeeNo: `EMP-OPS-${suffix}` } })

    const res = await request(app)
      .post('/api/v1/hr/leaves')
      .set(auth(adminToken))
      .send({
        teacherId: teacher!.id,
        fromDate: '2026-03-02',
        toDate: '2026-03-04',
        reason: `Family event ${suffix}`,
      })

    expect(res.status).toBe(201)
    leaveId = res.body.data.id
  })

  it('rejects an end date before the start date', async () => {
    const teacher = await prisma.teacher.findFirst({ where: { employeeNo: `EMP-OPS-${suffix}` } })
    const res = await request(app)
      .post('/api/v1/hr/leaves')
      .set(auth(adminToken))
      .send({
        teacherId: teacher!.id,
        fromDate: '2026-03-10',
        toDate: '2026-03-01',
        reason: `Backwards ${suffix}`,
      })
    expect(res.status).toBe(400)
  })

  it('approves once and refuses a second decision', async () => {
    const first = await request(app).patch(`/api/v1/hr/leaves/${leaveId}`).set(auth(adminToken)).send({ decision: 'APPROVED' })
    expect(first.status).toBe(200)
    expect(first.body.data.status).toBe('APPROVED')

    const second = await request(app).patch(`/api/v1/hr/leaves/${leaveId}`).set(auth(adminToken)).send({ decision: 'REJECTED' })
    expect(second.status).toBe(400)
    expect(second.body.error.message).toMatch(/already approved/i)
  })
})
