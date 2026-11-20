import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/** Reports module — aggregations, CSV export and ADMIN-only access. */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''

let classId = ''
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
        name: `RP-${suffix}`,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-06-30'),
        isCurrent: true,
      },
    }))

  const cls = await prisma.class.create({
    data: { name: `RPClass-${suffix}`, level: 91, academicYearId: year.id, capacity: 30 },
  })
  classId = cls.id
  const section = await prisma.section.create({ data: { classId, name: 'A', capacity: 30 } })
  const subject = await prisma.subject.create({
    data: { name: `RP-Subject-${suffix}`, code: `RP${suffix}`, classId, isElective: false },
  })

  const admin = await prisma.user.create({
    data: { email: `rp-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'RP Admin' },
  })
  const teacherUser = await prisma.user.create({
    data: { email: `rp-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'RP Teacher' },
  })
  const studentUser = await prisma.user.create({
    data: { email: `rp-student-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'RP Student' },
  })
  createdUserIds.push(admin.id, teacherUser.id, studentUser.id)

  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `RP-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 40000,
    },
  })

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `RPS-${suffix}`,
      rollNo: 'R1',
      dateOfBirth: new Date('2012-01-01'),
      gender: 'FEMALE',
      admissionDate: new Date('2025-08-01'),
      classId,
      status: 'ACTIVE',
    },
  })
  await prisma.enrollment.create({
    data: { studentId: student.id, classId, sectionId: section.id, academicYearId: year.id, rollNo: 'R1' },
  })

  // today's attendance + one invoice + one published exam with a result
  await prisma.attendance.create({
    data: {
      studentId: student.id,
      sectionId: section.id,
      date: new Date(new Date().toISOString().slice(0, 10)),
      status: 'PRESENT',
    },
  })
  await prisma.invoice.create({
    data: {
      invoiceNo: `RPINV-${suffix}`,
      studentId: student.id,
      sectionId: section.id,
      title: 'Tuition',
      period: '2026-02',
      amount: '10000.00',
      totalAmount: '10000.00',
      paidAmount: '4000.00',
      status: 'PARTIAL',
      dueDate: new Date('2026-02-10'),
    },
  })

  const exam = await prisma.exam.create({
    data: {
      name: `RP-Midterm-${suffix}`,
      type: 'MIDTERM',
      examDate: new Date('2026-02-01'),
      totalMarks: 100,
      passingMarks: 40,
      classId,
      sectionId: section.id,
      subjectId: subject.id,
      status: 'PUBLISHED',
    },
  })
  await prisma.examResult.create({
    data: { examId: exam.id, studentId: student.id, subjectId: subject.id, marksObtained: 82, grade: 'A' },
  })

  adminToken = await login(`rp-admin-${suffix}@test.pk`)
  teacherToken = await login(`rp-teacher-${suffix}@test.pk`)
  studentToken = await login(`rp-student-${suffix}@test.pk`)
})

afterAll(async () => {
  await prisma.exam.deleteMany({ where: { classId } })
  await prisma.invoice.deleteMany({ where: { student: { classId } } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.$disconnect()
})

describe('reports: access control', () => {
  it('teachers and learners are refused', async () => {
    for (const token of [teacherToken, studentToken]) {
      const res = await request(app).get('/api/v1/reports/fees').set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(403)
    }
  })

  it('anonymous requests are refused', async () => {
    const res = await request(app).get('/api/v1/reports/fees')
    expect(res.status).toBe(401)
  })
})

describe('reports: fees by class', () => {
  it('sums billed/paid per class', async () => {
    const res = await request(app).get('/api/v1/reports/fees').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)

    const row = res.body.data.find((r: { classId: string }) => r.classId === classId)
    expect(row).toBeDefined()
    expect(row.billed).toBe(10000)
    expect(row.paid).toBe(4000)
    expect(row.outstanding).toBe(6000)
    expect(row.collectionRate).toBe(40)
  })
})

describe('reports: attendance', () => {
  it('aggregates the section window', async () => {
    const res = await request(app)
      .get('/api/v1/reports/attendance?days=30')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)

    const row = res.body.data.find((r: { classId: string }) => r.classId === classId)
    expect(row).toBeDefined()
    expect(row.marked).toBeGreaterThanOrEqual(1)
    expect(row.rate).toBe(100)
  })
})

describe('reports: performance', () => {
  it('reports average, extremes and pass rate', async () => {
    const res = await request(app)
      .get('/api/v1/reports/performance')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)

    const row = res.body.data.find((r: { classId: string }) => r.classId === classId)
    expect(row).toBeDefined()
    expect(row.average).toBe(82)
    expect(row.highest).toBe(82)
    expect(row.lowest).toBe(82)
    expect(row.passRate).toBe(100)
  })
})

describe('reports: enrolment', () => {
  it('computes utilisation and gender split', async () => {
    const res = await request(app)
      .get('/api/v1/reports/enrolment')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)

    const row = res.body.data.find((r: { classId: string }) => r.classId === classId)
    expect(row).toBeDefined()
    expect(row.students).toBe(1)
    expect(row.sections).toBe(1)
    expect(row.genderSplit.female).toBe(1)
    expect(row.genderSplit.male).toBe(0)
  })
})

describe('reports: CSV export', () => {
  it('returns a text/csv attachment with a header row', async () => {
    const res = await request(app)
      .get('/api/v1/reports/export?type=fees')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/text\/csv/)
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="fees-by-class-.*\.csv"/)

    const [header, ...rows] = res.text.split('\n')
    expect(header).toBe('Class,Students,Invoices,Billed,Paid,Outstanding,Collection %,Overdue')
    expect(rows.some((line) => line.includes(`RPClass-${suffix}`))).toBe(true)
  })

  it('exports every report type', async () => {
    for (const type of ['attendance', 'performance', 'enrolment']) {
      const res = await request(app)
        .get(`/api/v1/reports/export?type=${type}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
      expect(res.text.split('\n').length).toBeGreaterThan(1)
    }
  })
})
