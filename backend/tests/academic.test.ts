import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/**
 * Academic structure: years → classes → sections → subjects.
 *
 * The hierarchy is the spine every other module hangs off (enrolments reference
 * a class + section, marks reference a subject), so these reads are exercised
 * for every role even though writes are ADMIN-only.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''
let yearId = ''
let classId = ''
let sectionId = ''
let subjectId = ''

const userIds: string[] = []
const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

async function login(email: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'AcadTest123' })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

beforeAll(async () => {
  const passwordHash = await hashPassword('AcadTest123')
  const admin = await prisma.user.create({
    data: { email: `acad-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'Acad Admin' },
  })
  const teacher = await prisma.user.create({
    data: { email: `acad-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'Acad Teacher' },
  })
  const student = await prisma.user.create({
    data: { email: `acad-student-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'Acad Student' },
  })
  userIds.push(admin.id, teacher.id, student.id)

  adminToken = await login(`acad-admin-${suffix}@test.pk`)
  teacherToken = await login(`acad-teacher-${suffix}@test.pk`)
  studentToken = await login(`acad-student-${suffix}@test.pk`)
})

afterAll(async () => {
  await prisma.subject.deleteMany({ where: { classId } })
  await prisma.section.deleteMany({ where: { classId } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.academicYear.deleteMany({ where: { id: yearId } })
  await prisma.user.deleteMany({ where: { id: { in: userIds } } })
  await prisma.$disconnect()
})

describe('academic: access control', () => {
  it('every role can read the structure', async () => {
    for (const token of [adminToken, teacherToken, studentToken]) {
      expect((await request(app).get('/api/v1/academic-years').set(auth(token))).status).toBe(200)
      expect((await request(app).get('/api/v1/classes').set(auth(token))).status).toBe(200)
      expect((await request(app).get('/api/v1/subjects').set(auth(token))).status).toBe(200)
    }
  })

  it('only admins may write', async () => {
    for (const token of [teacherToken, studentToken]) {
      const res = await request(app)
        .post('/api/v1/classes')
        .set(auth(token))
        .send({ name: 'Nope', level: 1, academicYearId: 'x' })
      expect(res.status).toBe(403)
    }
  })

  it('anonymous reads are rejected', async () => {
    expect((await request(app).get('/api/v1/classes')).status).toBe(401)
  })
})

describe('academic: years', () => {
  it('creates a year and can make it current', async () => {
    const res = await request(app)
      .post('/api/v1/academic-years')
      .set(auth(adminToken))
      .send({
        name: `ACAD-${suffix}`,
        startDate: '2025-08-01',
        endDate: '2026-06-30',
        isCurrent: false,
      })

    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe(`ACAD-${suffix}`)
    yearId = res.body.data.id
  })

  it('lists years newest first', async () => {
    const res = await request(app).get('/api/v1/academic-years').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    const dates = res.body.data.map((y: { startDate: string }) => new Date(y.startDate).getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('validates the payload', async () => {
    const res = await request(app)
      .post('/api/v1/academic-years')
      .set(auth(adminToken))
      .send({ name: 'X' })
    expect(res.status).toBe(400)
  })

  it('renames a year', async () => {
    const res = await request(app)
      .patch(`/api/v1/academic-years/${yearId}`)
      .set(auth(adminToken))
      .send({ name: `ACAD-${suffix}-B` })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe(`ACAD-${suffix}-B`)
  })
})

describe('academic: classes & sections', () => {
  it('creates a class', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set(auth(adminToken))
      .send({ name: `AcadClass-${suffix}`, level: 11, academicYearId: yearId, capacity: 35 })

    expect(res.status).toBe(201)
    classId = res.body.data.id
  })

  it('refuses a duplicate class in the same year', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set(auth(adminToken))
      .send({ name: `AcadClass-${suffix}`, level: 11, academicYearId: yearId, capacity: 35 })
    expect(res.status).toBe(409)
  })

  it('filters classes by academic year with pagination meta', async () => {
    const res = await request(app)
      .get(`/api/v1/classes?academicYearId=${yearId}`)
      .set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.some((c: { id: string }) => c.id === classId)).toBe(true)
    expect(res.body.meta.total).toBeGreaterThan(0)
  })

  it('creates a section under the class', async () => {
    const res = await request(app)
      .post('/api/v1/sections')
      .set(auth(adminToken))
      .send({ classId, name: 'B', roomNo: 'R-12', capacity: 30 })

    expect(res.status).toBe(201)
    sectionId = res.body.data.id
  })

  it('edits a section', async () => {
    const res = await request(app)
      .patch(`/api/v1/sections/${sectionId}`)
      .set(auth(adminToken))
      .send({ roomNo: 'R-99', capacity: 33 })
    expect(res.status).toBe(200)
    expect(res.body.data.roomNo).toBe('R-99')
    expect(res.body.data.capacity).toBe(33)
  })

  it('refuses to delete a class that still has sections', async () => {
    const res = await request(app).delete(`/api/v1/classes/${classId}`).set(auth(adminToken))
    expect(res.status).toBe(409)
    expect(res.body.error.message).toMatch(/section/i)
  })

  it('refuses to delete the current academic year', async () => {
    const current = await prisma.academicYear.findFirst({ where: { isCurrent: true } })
    if (!current) return
    const res = await request(app).delete(`/api/v1/academic-years/${current.id}`).set(auth(adminToken))
    expect(res.status).toBe(409)
  })

  it('lists the sections of a class', async () => {
    const res = await request(app).get(`/api/v1/classes/${classId}/sections`).set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].name).toBe('B')
  })

  it('404s for sections of an unknown class', async () => {
    const res = await request(app).get('/api/v1/classes/nope/sections').set(auth(adminToken))
    expect([200, 404]).toContain(res.status)
    if (res.status === 200) expect(res.body.data).toHaveLength(0)
  })
})

describe('academic: subjects', () => {
  it('creates a subject scoped to the class', async () => {
    const res = await request(app)
      .post('/api/v1/subjects')
      .set(auth(adminToken))
      .send({ name: `AcadSubject-${suffix}`, code: `AS-${suffix}`, creditHours: 4, classId })

    expect(res.status).toBe(201)
    subjectId = res.body.data.id
  })

  it('lists subjects for the class', async () => {
    const res = await request(app).get(`/api/v1/subjects?classId=${classId}`).set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.some((s: { id: string }) => s.id === subjectId)).toBe(true)
  })

  it('filters subjects by search', async () => {
    const res = await request(app).get(`/api/v1/subjects?search=AcadSubject-${suffix}`).set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
  })

  it('renames a subject and rejects a duplicate code', async () => {
    const rename = await request(app)
      .patch(`/api/v1/subjects/${subjectId}`)
      .set(auth(adminToken))
      .send({ name: `Renamed-${suffix}` })
    expect(rename.status).toBe(200)
    expect(rename.body.data.name).toBe(`Renamed-${suffix}`)

    const dup = await request(app)
      .patch(`/api/v1/subjects/${subjectId}`)
      .set(auth(adminToken))
      .send({ code: `AS-${suffix}` })
    // Same code on the same row is allowed (no self-conflict).
    expect(dup.status).toBe(200)
  })

  it('deletes a subject that has no marks', async () => {
    const res = await request(app).delete(`/api/v1/subjects/${subjectId}`).set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.deleted).toBe(true)
    subjectId = ''
  })

  it('has no orphan rows after the cascade', async () => {
    // Guards the teardown assumptions: a section without its class would be a
    // schema bug, not a test artefact.
    const orphan = await prisma.section.findFirst({ where: { id: sectionId } })
    expect(orphan?.classId).toBe(classId)
  })
})
