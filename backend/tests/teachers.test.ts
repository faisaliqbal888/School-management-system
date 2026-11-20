import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/** Teachers CRUD: creation with a linked user, filters, export, archive. */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let subjectId = ''
let classId = ''
let teacherId = ''
let createdTeacherUserId = ''

const adminUserIds: string[] = []
const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

async function login(email: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'TchTest123' })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

beforeAll(async () => {
  const passwordHash = await hashPassword('TchTest123')
  const admin = await prisma.user.create({
    data: { email: `tch-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'Tch Admin' },
  })
  const teacherUser = await prisma.user.create({
    data: { email: `tch-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'Tch Teacher' },
  })
  adminUserIds.push(admin.id, teacherUser.id)

  await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `TCH-${suffix}`,
      department: `Dept-${suffix}`,
      designation: 'Senior Teacher',
      joiningDate: new Date('2023-04-01'),
      baseSalary: 92000,
    },
  })

  const year = await prisma.academicYear.create({
    data: {
      name: `TCH-${suffix}`,
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: false,
    },
  })
  const cls = await prisma.class.create({
    data: { name: `TchClass-${suffix}`, level: 66, academicYearId: year.id, capacity: 30 },
  })
  const subject = await prisma.subject.create({
    data: { name: `TchSubject-${suffix}`, code: `TS-${suffix}`, creditHours: 3, classId: cls.id },
  })
  classId = cls.id
  subjectId = subject.id

  adminToken = await login(`tch-admin-${suffix}@test.pk`)
  teacherToken = await login(`tch-teacher-${suffix}@test.pk`)
})

afterAll(async () => {
  if (teacherId) {
    await prisma.teacher.deleteMany({ where: { id: teacherId } })
  }
  if (createdTeacherUserId) await prisma.user.deleteMany({ where: { id: createdTeacherUserId } })
  await prisma.teacherSubject.deleteMany({ where: { subjectId } }).catch(() => {})
  await prisma.subject.deleteMany({ where: { id: subjectId } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.academicYear.deleteMany({ where: { name: `TCH-${suffix}` } })
  await prisma.teacher.deleteMany({ where: { employeeNo: `TCH-${suffix}` } })
  await prisma.user.deleteMany({ where: { id: { in: adminUserIds } } })
  await prisma.$disconnect()
})

describe('teachers: access control', () => {
  it('teachers can read the directory', async () => {
    const res = await request(app).get('/api/v1/teachers').set(auth(teacherToken))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('teachers cannot create', async () => {
    const res = await request(app).post('/api/v1/teachers').set(auth(teacherToken)).send({})
    expect(res.status).toBe(403)
  })

  it('anonymous requests are rejected', async () => {
    expect((await request(app).get('/api/v1/teachers')).status).toBe(401)
  })
})

describe('teachers: create', () => {
  it('creates a teacher and its login account', async () => {
    const res = await request(app)
      .post('/api/v1/teachers')
      .set(auth(adminToken))
      .send({
        name: `New Teacher ${suffix}`,
        email: `tch-new-${suffix}@test.pk`,
        phone: '03005556666',
        department: `Dept-${suffix}`,
        designation: 'Lecturer',
        joiningDate: '2024-02-01',
        baseSalary: 75000,
        subjectIds: [subjectId],
      })

    expect(res.status).toBe(201)
    expect(res.body.data.teacher.email).toBe(`tch-new-${suffix}@test.pk`)
    expect(res.body.data.credentials.temporaryPassword).toBeTruthy()

    teacherId = res.body.data.teacher.id
    createdTeacherUserId = res.body.data.teacher.userId ?? ''
    if (!createdTeacherUserId) {
      const row = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId }, select: { userId: true } })
      createdTeacherUserId = row.userId
    }
  })

  it('rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/teachers')
      .set(auth(adminToken))
      .send({
        name: 'Dup',
        email: `tch-new-${suffix}@test.pk`,
        department: 'D',
        designation: 'T',
        joiningDate: '2024-02-01',
        baseSalary: 1000,
      })
    expect(res.status).toBe(409)
  })

  it('validates the payload', async () => {
    const res = await request(app)
      .post('/api/v1/teachers')
      .set(auth(adminToken))
      .send({ name: 'X', email: 'bad', baseSalary: -5 })
    expect(res.status).toBe(400)
  })
})

describe('teachers: read, filters & update', () => {
  it('returns one teacher with counts', async () => {
    const res = await request(app).get(`/api/v1/teachers/${teacherId}`).set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.department).toBe(`Dept-${suffix}`)
  })

  it('404s for an unknown id', async () => {
    expect((await request(app).get('/api/v1/teachers/nope').set(auth(adminToken))).status).toBe(404)
  })

  it('filters by department', async () => {
    const res = await request(app)
      .get(`/api/v1/teachers?department=Dept-${suffix}`)
      .set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data.every((t: { department: string }) => t.department === `Dept-${suffix}`)).toBe(true)
  })

  it('filters by search term', async () => {
    const res = await request(app).get(`/api/v1/teachers?search=New Teacher ${suffix}`).set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.some((t: { id: string }) => t.id === teacherId)).toBe(true)
  })

  it('exposes filter options', async () => {
    const res = await request(app).get('/api/v1/teachers/filters').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.departments)).toBe(true)
  })

  it('updates designation and salary', async () => {
    const res = await request(app)
      .patch(`/api/v1/teachers/${teacherId}`)
      .set(auth(adminToken))
      .send({ designation: 'Head of Department', baseSalary: 110000 })

    expect(res.status).toBe(200)
    expect(res.body.data.designation).toBe('Head of Department')
  })

  it('streams a CSV export', async () => {
    const res = await request(app).get('/api/v1/teachers/export.csv').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toMatch(/csv/)
    expect(res.text.split('\n')[0]).toMatch(/employee|name/i)
  })
})

describe('teachers: archive', () => {
  it('deactivates rather than deleting the record', async () => {
    const res = await request(app).delete(`/api/v1/teachers/${teacherId}`).set(auth(adminToken))
    expect(res.status).toBe(200)

    expect(res.body.data.status).toBe('TERMINATED')

    const archived = await prisma.teacher.findUniqueOrThrow({ where: { id: teacherId } })
    expect(archived.status).toBe('TERMINATED')

    // The linked login is deactivated in the same transaction.
    const account = await prisma.user.findUniqueOrThrow({ where: { id: createdTeacherUserId } })
    expect(account.status).toBe('INACTIVE')
  })
})
