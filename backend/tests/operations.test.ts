import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/** Library / transport / hostel / inventory — reads plus one safe write flow. */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''

const createdUserIds: string[] = []
let createdBookId = ''
let createdIssueId = ''

async function login(email: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'TestPass123' })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

beforeAll(async () => {
  const passwordHash = await hashPassword('TestPass123')
  const year =
    (await prisma.academicYear.findFirst({ where: { isCurrent: true } })) ??
    (await prisma.academicYear.create({
      data: {
        name: `OP-${suffix}`,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-06-30'),
        isCurrent: true,
      },
    }))

  const cls = await prisma.class.create({
    data: { name: `OPClass-${suffix}`, level: 90, academicYearId: year.id, capacity: 20 },
  })
  const section = await prisma.section.create({ data: { classId: cls.id, name: 'A', capacity: 20 } })

  const admin = await prisma.user.create({
    data: { email: `op-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'OP Admin' },
  })
  const teacherUser = await prisma.user.create({
    data: { email: `op-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'OP Teacher' },
  })
  const studentUser = await prisma.user.create({
    data: { email: `op-student-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'OP Student' },
  })
  createdUserIds.push(admin.id, teacherUser.id, studentUser.id)

  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `OP-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 40000,
    },
  })

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `OPS-${suffix}`,
      rollNo: 'O1',
      dateOfBirth: new Date('2012-01-01'),
      gender: 'MALE',
      admissionDate: new Date('2025-08-01'),
      classId: cls.id,
      status: 'ACTIVE',
    },
  })
  await prisma.enrollment.create({
    data: { studentId: student.id, classId: cls.id, sectionId: section.id, academicYearId: year.id, rollNo: 'O1' },
  })

  const book = await prisma.book.create({
    data: {
      title: `OP-Book-${suffix}`,
      author: 'Test Author',
      category: 'Reference',
      totalCopies: 2,
      availableCopies: 2,
    },
  })
  createdBookId = book.id

  adminToken = await login(`op-admin-${suffix}@test.pk`)
  teacherToken = await login(`op-teacher-${suffix}@test.pk`)
  studentToken = await login(`op-student-${suffix}@test.pk`)
})

afterAll(async () => {
  if (createdIssueId) await prisma.bookIssue.deleteMany({ where: { id: createdIssueId } })
  await prisma.book.deleteMany({ where: { id: createdBookId } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { name: `OPClass-${suffix}` } })
  await prisma.$disconnect()
})

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

describe('operations: access control', () => {
  it('learners are refused everywhere', async () => {
    for (const path of ['/library/overview', '/transport/overview', '/hostel/overview', '/inventory/overview']) {
      const res = await request(app).get(`/api/v1${path}`).set(auth(studentToken))
      expect(res.status).toBe(403)
    }
  })

  it('teachers can read but not write', async () => {
    const read = await request(app).get('/api/v1/library/overview').set(auth(teacherToken))
    expect(read.status).toBe(200)

    const write = await request(app)
      .post('/api/v1/library/issues')
      .set(auth(teacherToken))
      .send({ bookId: createdBookId, studentId: 'x', dueDate: '2026-01-01' })
    expect(write.status).toBe(403)
  })
})

describe('operations: overviews', () => {
  it('library overview reports the catalogue', async () => {
    const res = await request(app).get('/api/v1/library/overview').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.titles).toBeGreaterThan(0)
    expect(res.body.data.copies).toBeGreaterThan(0)
  })

  it('books can be searched', async () => {
    const res = await request(app)
      .get(`/api/v1/library/books?search=OP-Book-${suffix}`)
      .set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBe(createdBookId)
  })

  it('transport, hostel and inventory return shaped payloads', async () => {
    const transport = await request(app).get('/api/v1/transport/overview').set(auth(adminToken))
    expect(transport.status).toBe(200)
    expect(Array.isArray(transport.body.data.routes)).toBe(true)

    const hostel = await request(app).get('/api/v1/hostel/overview').set(auth(adminToken))
    expect(hostel.status).toBe(200)
    expect(Array.isArray(hostel.body.data.rooms)).toBe(true)

    const inventory = await request(app).get('/api/v1/inventory/overview').set(auth(adminToken))
    expect(inventory.status).toBe(200)
    expect(Array.isArray(inventory.body.data.items)).toBe(true)
    expect(typeof inventory.body.data.totalValue).toBe('number')
  })
})

describe('operations: lending flow', () => {
  it('issues a copy and decrements availability', async () => {
    const student = await prisma.student.findFirstOrThrow({
      where: { admissionNo: `OPS-${suffix}` },
      select: { id: true },
    })

    const res = await request(app)
      .post('/api/v1/library/issues')
      .set(auth(adminToken))
      .send({ bookId: createdBookId, studentId: student.id, dueDate: '2026-12-31' })

    expect(res.status).toBe(201)
    createdIssueId = res.body.data.id

    const book = await prisma.book.findUniqueOrThrow({ where: { id: createdBookId } })
    expect(book.availableCopies).toBe(1)
  })

  it('refuses a return for an unknown loan', async () => {
    const res = await request(app)
      .patch('/api/v1/library/issues/does-not-exist/return')
      .set(auth(adminToken))
      .send({})
    expect(res.status).toBe(404)
  })

  it('returns the copy and restores availability', async () => {
    const res = await request(app)
      .patch(`/api/v1/library/issues/${createdIssueId}/return`)
      .set(auth(adminToken))
      .send({})

    expect(res.status).toBe(200)
    expect(res.body.data.returned).toBe(true)

    const book = await prisma.book.findUniqueOrThrow({ where: { id: createdBookId } })
    expect(book.availableCopies).toBe(2)
  })

  it('a second return is rejected', async () => {
    const res = await request(app)
      .patch(`/api/v1/library/issues/${createdIssueId}/return`)
      .set(auth(adminToken))
      .send({})
    expect(res.status).toBe(400)
  })

  it('refuses to issue when no copies remain', async () => {
    const student = await prisma.student.findFirstOrThrow({
      where: { admissionNo: `OPS-${suffix}` },
      select: { id: true },
    })
    await prisma.book.update({ where: { id: createdBookId }, data: { availableCopies: 0 } })

    const res = await request(app)
      .post('/api/v1/library/issues')
      .set(auth(adminToken))
      .send({ bookId: createdBookId, studentId: student.id, dueDate: '2026-12-31' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/no copies/i)

    await prisma.book.update({ where: { id: createdBookId }, data: { availableCopies: 2 } })
  })

  it('marks past-due loans overdue', async () => {
    const res = await request(app).post('/api/v1/library/refresh-overdue').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(typeof res.body.data.updated).toBe('number')
  })
})
