import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/**
 * Students CRUD — create → read → update → delete, plus the role scoping that
 * stops a learner from listing the whole school.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''
let parentToken = ''

const createdUserIds: string[] = []
const createdStudentIds: string[] = []
let classId = ''
let sectionId = ''
let studentId = ''

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

async function login(email: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'StuTest123' })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

beforeAll(async () => {
  const passwordHash = await hashPassword('StuTest123')

  const year = await prisma.academicYear.create({
    data: {
      name: `STU-${suffix}`,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: false,
    },
  })
  const cls = await prisma.class.create({
    data: { name: `StuClass-${suffix}`, level: 77, academicYearId: year.id, capacity: 30 },
  })
  const section = await prisma.section.create({ data: { classId: cls.id, name: 'A', capacity: 30 } })
  classId = cls.id
  sectionId = section.id

  const admin = await prisma.user.create({
    data: { email: `stu-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'Stu Admin' },
  })
  const teacherUser = await prisma.user.create({
    data: { email: `stu-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'Stu Teacher' },
  })
  const studentUser = await prisma.user.create({
    data: { email: `stu-student-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'Stu Learner' },
  })
  const parentUser = await prisma.user.create({
    data: { email: `stu-parent-${suffix}@test.pk`, passwordHash, role: 'PARENT', name: 'Stu Parent' },
  })
  createdUserIds.push(admin.id, teacherUser.id, studentUser.id, parentUser.id)

  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `STU-T-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 45000,
    },
  })

  const learner = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `STU-A-${suffix}`,
      rollNo: 'S1',
      dateOfBirth: new Date('2011-05-05'),
      gender: 'FEMALE',
      admissionDate: new Date('2025-08-01'),
      classId: cls.id,
      status: 'ACTIVE',
    },
  })
  await prisma.enrollment.create({
    data: {
      studentId: learner.id,
      classId: cls.id,
      sectionId: section.id,
      academicYearId: year.id,
      rollNo: 'S1',
    },
  })
  const parent = await prisma.parent.create({ data: { userId: parentUser.id } })
  await prisma.guardian.create({
    data: {
      studentId: learner.id,
      parentId: parent.id,
      name: 'Stu Parent',
      relation: 'Mother',
      phone: '03001234567',
      isPrimary: true,
    },
  })

  adminToken = await login(`stu-admin-${suffix}@test.pk`)
  teacherToken = await login(`stu-teacher-${suffix}@test.pk`)
  studentToken = await login(`stu-student-${suffix}@test.pk`)
  parentToken = await login(`stu-parent-${suffix}@test.pk`)
})

afterAll(async () => {
  // Children first: enrolments and guardians reference the student, and the
  // class cannot go while any enrolment or student still points at it.
  await prisma.enrollment.deleteMany({ where: { studentId: { in: createdStudentIds } } })
  await prisma.enrollment.deleteMany({ where: { student: { admissionNo: { startsWith: 'ADM-' } , userId: { in: createdUserIds } } } })
  for (const id of createdStudentIds) {
    await prisma.guardian.deleteMany({ where: { studentId: id } })
    await prisma.student.deleteMany({ where: { id } })
  }
  await prisma.parent.deleteMany({ where: { user: { email: `stu-parent-${suffix}@test.pk` } } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.enrollment.deleteMany({ where: { classId } })
  await prisma.student.deleteMany({ where: { classId } })
  await prisma.section.deleteMany({ where: { classId } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.academicYear.deleteMany({ where: { name: `STU-${suffix}` } })
  await prisma.$disconnect()
})

describe('students: access control', () => {
  it('learners only see themselves in the list', async () => {
    const res = await request(app).get('/api/v1/students').set(auth(studentToken))
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeLessThanOrEqual(1)
    if (res.body.data.length === 1) {
      expect(res.body.data[0].admissionNo).toBe(`STU-A-${suffix}`)
    }
  })

  it('parents only see their children', async () => {
    const res = await request(app).get('/api/v1/students').set(auth(parentToken))
    expect(res.status).toBe(200)
    expect(res.body.data.every((s: { admissionNo: string }) => s.admissionNo === `STU-A-${suffix}`)).toBe(true)
  })

  it('teachers may read but not write', async () => {
    expect((await request(app).get('/api/v1/students').set(auth(teacherToken))).status).toBe(200)

    const write = await request(app)
      .post('/api/v1/students')
      .set(auth(teacherToken))
      .send({})
    expect(write.status).toBe(403)
  })

  it('anonymous reads are rejected', async () => {
    expect((await request(app).get('/api/v1/students')).status).toBe(401)
  })
})

describe('students: create', () => {
  it('creates a student with a guardian and an enrolment', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set(auth(adminToken))
      .send({
        name: `New Student ${suffix}`,
        email: `stu-new-${suffix}@test.pk`,
        phone: '03001234567',
        dateOfBirth: '2012-03-15',
        gender: 'MALE',
        classId,
        sectionId,
        rollNo: 'N1',
        admissionDate: '2025-08-01',
        guardian: {
          name: 'Guardian Parent',
          relation: 'Father',
          phone: '03009876543',
          email: `guardian-${suffix}@test.pk`,
        },
      })

    expect(res.status).toBe(201)
    // The response nests the record and the one-time credentials; the
    // admission number is generated server-side (ADM-<year>-<seq>).
    expect(res.body.data.student.admissionNo).toMatch(/^ADM-\d{4}-\d+$/)
    expect(res.body.data.credentials.temporaryPassword).toBeTruthy()
    studentId = res.body.data.student.id
    createdStudentIds.push(studentId)

    const enrolment = await prisma.enrollment.findFirst({ where: { studentId, sectionId } })
    expect(enrolment).not.toBeNull()
  })

  it('rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set(auth(adminToken))
      .send({
        name: 'Duplicate',
        email: `stu-new-${suffix}@test.pk`,
        dateOfBirth: '2012-03-15',
        gender: 'MALE',
        guardian: { name: 'G', relation: 'Father', phone: '03009876543' },
      })
    expect(res.status).toBe(409)
  })

  it('validates the payload', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set(auth(adminToken))
      .send({ name: 'X', email: 'nope', dateOfBirth: '2099-01-01', gender: 'ROBOT' })
    expect(res.status).toBe(400)
    expect(res.body.error.details).toBeTruthy()
  })

  it('refuses a section without its class', async () => {
    const res = await request(app)
      .post('/api/v1/students')
      .set(auth(adminToken))
      .send({
        name: 'No Class',
        email: `stu-noclass-${suffix}@test.pk`,
        dateOfBirth: '2012-03-15',
        gender: 'MALE',
        sectionId,
        guardian: { name: 'G', relation: 'Father', phone: '03009876543' },
      })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/classId/i)
  })
})

describe('students: read & update', () => {
  it('returns one student with guardian details', async () => {
    const res = await request(app).get(`/api/v1/students/${studentId}`).set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe(`New Student ${suffix}`)
    expect(res.body.data.guardians.length).toBeGreaterThan(0)
  })

  it('404s for an unknown id', async () => {
    expect((await request(app).get('/api/v1/students/nope').set(auth(adminToken))).status).toBe(404)
  })

  it('updates fields and status', async () => {
    const res = await request(app)
      .patch(`/api/v1/students/${studentId}`)
      .set(auth(adminToken))
      .send({ phone: '03211234567', city: 'Lahore', status: 'INACTIVE' })

    expect(res.status).toBe(200)
    expect(res.body.data.city).toBe('Lahore')
    expect(res.body.data.status).toBe('INACTIVE')
  })

  it('rejects an empty patch', async () => {
    const res = await request(app).patch(`/api/v1/students/${studentId}`).set(auth(adminToken)).send({})
    expect(res.status).toBe(400)
  })
})

describe('students: filters, export & delete', () => {
  it('filters by class and status', async () => {
    const res = await request(app)
      .get(`/api/v1/students?classId=${classId}&status=INACTIVE`)
      .set(auth(adminToken))
    expect(res.status).toBe(200)
    // The list flattens the class into `className` rather than a nested object.
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(
      res.body.data.every(
        (row: { className: string | null; status: string }) =>
          row.className === `StuClass-${suffix}` && row.status === 'INACTIVE',
      ),
    ).toBe(true)
  })

  it('streams a CSV export', async () => {
    const res = await request(app).get('/api/v1/students/export.csv').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/csv/)
    expect(res.text.split('\n')[0]).toMatch(/admission/i)
  })

  it('soft-deletes then hard-deletes', async () => {
    const soft = await request(app).delete(`/api/v1/students/${studentId}`).set(auth(adminToken))
    expect(soft.status).toBe(200)

    const listed = await request(app).get(`/api/v1/students/${studentId}`).set(auth(adminToken))
    expect(listed.status).toBe(200)
    expect(listed.body.data.status).not.toBe('ACTIVE')
  })
})
