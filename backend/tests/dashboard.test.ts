import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/** Dashboard summary — role shaping and the RBAC promises it makes. */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''
let parentToken = ''

let classId = ''
let sectionId = ''

const createdUserIds: string[] = []

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
        name: `DB-${suffix}`,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-06-30'),
        isCurrent: true,
      },
    }))

  const cls = await prisma.class.create({
    data: { name: `DBClass-${suffix}`, level: 92, academicYearId: year.id, capacity: 20 },
  })
  classId = cls.id
  const section = await prisma.section.create({ data: { classId, name: 'A', capacity: 20 } })
  sectionId = section.id

  const subject = await prisma.subject.create({
    data: { name: `DB-Subject-${suffix}`, code: `DB${suffix}`, classId, isElective: false },
  })

  const admin = await prisma.user.create({
    data: { email: `db-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'DB Admin' },
  })
  const teacherUser = await prisma.user.create({
    data: { email: `db-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'DB Teacher' },
  })
  const studentUser = await prisma.user.create({
    data: { email: `db-student-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'DB Student' },
  })
  const parentUser = await prisma.user.create({
    data: { email: `db-parent-${suffix}@test.pk`, passwordHash, role: 'PARENT', name: 'DB Parent' },
  })
  createdUserIds.push(admin.id, teacherUser.id, studentUser.id, parentUser.id)

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `DB-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 45000,
    },
  })

  await prisma.timetableSlot.create({
    data: {
      classId,
      sectionId,
      subjectId: subject.id,
      teacherId: teacher.id,
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '08:45',
    },
  })

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `DBS-${suffix}`,
      rollNo: 'D1',
      dateOfBirth: new Date('2012-01-01'),
      gender: 'MALE',
      admissionDate: new Date('2025-08-01'),
      classId,
      status: 'ACTIVE',
    },
  })
  await prisma.enrollment.create({
    data: { studentId: student.id, classId, sectionId, academicYearId: year.id, rollNo: 'D1' },
  })

  const parentRecord = await prisma.parent.create({ data: { userId: parentUser.id, occupation: 'Tester' } })
  await prisma.guardian.create({
    data: {
      studentId: student.id,
      parentId: parentRecord.id,
      name: 'DB Parent',
      relation: 'Father',
      phone: '+923004445556',
      isPrimary: true,
    },
  })

  // today's attendance + a paid invoice for this learner
  await prisma.attendance.create({
    data: { studentId: student.id, sectionId, date: new Date(new Date().toISOString().slice(0, 10)), status: 'PRESENT' },
  })
  await prisma.invoice.create({
    data: {
      invoiceNo: `DBINV-${suffix}`,
      studentId: student.id,
      title: 'Tuition',
      period: '2026-01',
      sectionId,
      amount: '15000.00',
      totalAmount: '15000.00',
      paidAmount: '15000.00',
      status: 'PAID',
      dueDate: new Date('2026-01-10'),
    },
  })

  adminToken = await login(`db-admin-${suffix}@test.pk`)
  teacherToken = await login(`db-teacher-${suffix}@test.pk`)
  studentToken = await login(`db-student-${suffix}@test.pk`)
  parentToken = await login(`db-parent-${suffix}@test.pk`)
})

afterAll(async () => {
  await prisma.timetableSlot.deleteMany({ where: { classId } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.$disconnect()
})

const get = (token: string) =>
  request(app).get('/api/v1/dashboard/summary').set('Authorization', `Bearer ${token}`)

describe('dashboard: admin', () => {
  it('returns school-wide counts and fee totals', async () => {
    const res = await get(adminToken)
    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('ADMIN')
    expect(res.body.data.counts.students).toBeGreaterThan(0)
    expect(res.body.data.counts.teachers).toBeGreaterThan(0)
    expect(res.body.data.fees.currency).toBe('PKR')
    expect(res.body.data.fees.billed).toBeGreaterThan(0)
  })

  it('includes a 7-day attendance trend', async () => {
    const res = await get(adminToken)
    expect(res.body.data.attendance.trend.series).toHaveLength(7)
    expect(res.body.data.attendance.trend.overall.total).toBeGreaterThan(0)
  })

  it('includes recent enrolments and today’s lessons', async () => {
    const res = await get(adminToken)
    expect(Array.isArray(res.body.data.recentStudents)).toBe(true)
    expect(res.body.data.recentStudents.length).toBeGreaterThan(0)
    expect(Array.isArray(res.body.data.today.lessons)).toBe(true)
  })
})

describe('dashboard: teacher', () => {
  it('scopes counts to the teacher’s own sections', async () => {
    const res = await get(teacherToken)
    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('TEACHER')
    expect(res.body.data.counts.lessons).toBe(1)
    expect(res.body.data.counts.students).toBe(1)
    expect(res.body.data.sections[0].className).toBe(`DBClass-${suffix}`)
  })

  it('never exposes financial data', async () => {
    const res = await get(teacherToken)
    expect(res.body.data.fees).toBeUndefined()
    expect(JSON.stringify(res.body.data)).not.toMatch(/billed|outstanding|collectionRate/)
  })
})

describe('dashboard: learner and parent', () => {
  it('students see only their own attendance and fees', async () => {
    const res = await get(studentToken)
    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('STUDENT')
    expect(res.body.data.counts.students).toBe(1)
    expect(res.body.data.attendance.today.marked).toBe(1)
    expect(res.body.data.attendance.today.rate).toBe(100)
    expect(res.body.data.fees.billed).toBe(15000)
    // the school-wide total is never leaked
    expect(res.body.data.fees.billed).toBeLessThan(100000)
  })

  it('parents get the same view for their children', async () => {
    const res = await get(parentToken)
    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('PARENT')
    expect(res.body.data.students.map((s: { name: string }) => s.name)).toContain('DB Student')
    expect(res.body.data.fees.billed).toBe(15000)
  })

  it('a learner without a linked student gets an empty, safe payload', async () => {
    const passwordHash = await hashPassword('TestPass123')
    const orphan = await prisma.user.create({
      data: { email: `db-orphan-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'No Enrolment' },
    })
    try {
      const token = await login(`db-orphan-${suffix}@test.pk`)
      const res = await get(token)
      expect(res.status).toBe(200)
      expect(res.body.data.counts.students).toBe(0)
      expect(res.body.data.fees).toBeNull()
      expect(res.body.data.results).toEqual([])
    } finally {
      await prisma.user.delete({ where: { id: orphan.id } })
    }
  })

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary')
    expect(res.status).toBe(401)
  })
})
