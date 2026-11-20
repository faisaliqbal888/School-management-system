import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/**
 * Attendance module — integration tests against the real database.
 *
 * Creates its own academic year / class / section / teacher / students so the
 * assertions never depend on seed data that may change.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''

let yearId = ''
let classId = ''
let sectionId = ''
let otherSectionId = ''
let teacherUserId = ''
let studentIds: string[] = []
const createdUserIds: string[] = []

async function login(email: string, password: string): Promise<string> {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

const TODAY = new Date().toISOString().slice(0, 10)

beforeAll(async () => {
  const passwordHash = await hashPassword('TestPass123')

  // academic year (reuse the current one if present)
  const year =
    (await prisma.academicYear.findFirst({ where: { isCurrent: true } })) ??
    (await prisma.academicYear.create({
      data: { name: `TEST-${suffix}`, startDate: new Date('2025-08-01'), endDate: new Date('2026-06-30'), isCurrent: true },
    }))
  yearId = year.id

  const cls = await prisma.class.create({
    data: { name: `TestClass-${suffix}`, level: 99, academicYearId: yearId, capacity: 40 },
  })
  classId = cls.id

  const sectionA = await prisma.section.create({ data: { classId, name: 'A', capacity: 40 } })
  const sectionB = await prisma.section.create({ data: { classId, name: 'B', capacity: 40 } })
  sectionId = sectionA.id
  otherSectionId = sectionB.id

  // admin
  const admin = await prisma.user.create({
    data: {
      email: `att-admin-${suffix}@test.pk`,
      passwordHash,
      role: 'ADMIN',
      name: 'Attendance Admin',
    },
  })
  createdUserIds.push(admin.id)

  // teacher (+ subject assignment on section A only)
  const teacherUser = await prisma.user.create({
    data: {
      email: `att-teacher-${suffix}@test.pk`,
      passwordHash,
      role: 'TEACHER',
      name: 'Attendance Teacher',
    },
  })
  teacherUserId = teacherUser.id
  createdUserIds.push(teacherUser.id)

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUserId,
      employeeNo: `TST-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 50000,
    },
  })

  const subject = await prisma.subject.create({
    data: { name: `TestSubject-${suffix}`, code: `TS${suffix}`, classId, isElective: false },
  })

  await prisma.subjectAssignment.create({
    data: { subjectId: subject.id, teacherId: teacher.id, sectionId },
  })

  // students: 3 in section A, 1 in section B
  const ids: string[] = []
  for (let i = 0; i < 4; i++) {
    const targetSection = i === 3 ? sectionB : sectionA
    const user = await prisma.user.create({
      data: {
        email: `att-student-${i}-${suffix}@test.pk`,
        passwordHash,
        role: 'STUDENT',
        name: `Attendance Student ${i}`,
      },
    })
    createdUserIds.push(user.id)

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNo: `TST-STU-${suffix}-${i}`,
        rollNo: `T${i + 1}`,
        dateOfBirth: new Date('2012-01-01'),
        gender: 'MALE',
        admissionDate: new Date('2025-08-01'),
        classId,
        status: 'ACTIVE',
      },
    })

    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId,
        sectionId: targetSection.id,
        academicYearId: yearId,
        rollNo: `T${i + 1}`,
      },
    })

    ids.push(student.id)
  }
  studentIds = ids

  adminToken = await login(`att-admin-${suffix}@test.pk`, 'TestPass123')
  teacherToken = await login(`att-teacher-${suffix}@test.pk`, 'TestPass123')
  studentToken = await login(`att-student-0-${suffix}@test.pk`, 'TestPass123')
})

afterAll(async () => {
  // cascade deletes attendance, enrollments, assignments, teacher, students
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.$disconnect()
})

describe('attendance: sections & roster', () => {
  it('teacher sees only their own section', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/sections')
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].id).toBe(sectionId)
    expect(res.body.data[0].studentCount).toBe(3)
  })

  it('admin sees both sections', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/sections')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    const ids = res.body.data.map((s: { id: string }) => s.id)
    expect(ids).toContain(sectionId)
    expect(ids).toContain(otherSectionId)
  })

  it('roster lists enrolled students sorted by roll no', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/roster/${sectionId}?date=${TODAY}`)
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.entries).toHaveLength(3)
    expect(res.body.data.entries.map((e: { rollNo: string }) => e.rollNo)).toEqual(['T1', 'T2', 'T3'])
    expect(res.body.data.summary.UNMARKED).toBe(3)
  })

  it('teacher cannot read another section', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/roster/${otherSectionId}?date=${TODAY}`)
      .set('Authorization', `Bearer ${teacherToken}`)
    expect(res.status).toBe(403)
  })

  it('students cannot read rosters', async () => {
    const res = await request(app)
      .get(`/api/v1/attendance/roster/${sectionId}?date=${TODAY}`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(403)
  })
})

describe('attendance: marking', () => {
  it('bulk marks a section and is idempotent on re-submit', async () => {
    const entries = studentIds.slice(0, 3).map((studentId, i) => ({
      studentId,
      status: i === 1 ? 'ABSENT' : 'PRESENT',
      remarks: i === 1 ? 'Sick' : null,
    }))

    const first = await request(app)
      .post('/api/v1/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ sectionId, date: TODAY, entries })

    expect(first.status).toBe(200)
    expect(first.body.data.saved).toBe(3)
    expect(first.body.data.summary).toEqual({ PRESENT: 2, ABSENT: 1 })

    // re-submit with different statuses — upsert, not duplicates
    const second = await request(app)
      .post('/api/v1/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        sectionId,
        date: TODAY,
        entries: entries.map((e) => ({ ...e, status: 'LATE' })),
      })

    expect(second.status).toBe(200)
    expect(second.body.data.summary).toEqual({ LATE: 3 })

    const roster = await request(app)
      .get(`/api/v1/attendance/roster/${sectionId}?date=${TODAY}`)
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(roster.body.data.summary.LATE).toBe(3)
    expect(roster.body.data.marked).toBe(true)
  })

  it('rejects students who are not in the section', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        sectionId,
        date: TODAY,
        entries: [{ studentId: studentIds[3], status: 'PRESENT' }], // this one is in section B
      })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/not enrolled/i)
  })

  it('rejects a future date', async () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
    const res = await request(app)
      .post('/api/v1/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ sectionId, date: tomorrow, entries: [{ studentId: studentIds[0], status: 'PRESENT' }] })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/future/i)
  })

  it('validates the payload', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ sectionId, date: 'not-a-date', entries: [] })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('student cannot mark attendance', async () => {
    const res = await request(app)
      .post('/api/v1/attendance/bulk')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ sectionId, date: TODAY, entries: [{ studentId: studentIds[0], status: 'PRESENT' }] })

    expect(res.status).toBe(403)
  })
})

describe('attendance: history & summary', () => {
  it('student only sees their own records', async () => {
    const res = await request(app)
      .get('/api/v1/attendance?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    const mine = res.body.data.filter((r: { studentId: string }) => r.studentId === studentIds[0])
    expect(mine.length).toBeGreaterThan(0)
    const foreign = res.body.data.filter((r: { studentId: string }) => r.studentId !== studentIds[0])
    expect(foreign).toHaveLength(0)
  })

  it('teacher sees history for their sections only', async () => {
    const res = await request(app)
      .get('/api/v1/attendance?limit=50')
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    // none of the rows may belong to section B
    expect(
      res.body.data.every((r: { admissionNo: string }) => r.admissionNo !== `TST-STU-${suffix}-3`),
    ).toBe(true)
  })

  it('summary computes a rate for the student', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/summary')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.scope).toBe('self')
    expect(res.body.data.totalDays).toBeGreaterThan(0)
    expect(typeof res.body.data.rate).toBe('number')
    expect(res.body.data.monthly.length).toBeGreaterThan(0)
  })

  it('admin overview reports today’s totals', async () => {
    const res = await request(app)
      .get('/api/v1/attendance/overview')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.date).toBe(TODAY)
    expect(res.body.data.byStatus.late).toBeGreaterThanOrEqual(3)
    expect(res.body.data.sectionsTotal).toBeGreaterThanOrEqual(2)
  })
})
