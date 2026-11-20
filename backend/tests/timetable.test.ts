import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/** Timetable module — integration tests on the real database. */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''
let parentToken = ''

let classId = ''
let sectionId = ''
let otherSectionId = ''
let subjectId = ''
let otherSubjectId = ''
let teacherId = ''
let slotId = ''

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
      data: { name: `TT-${suffix}`, startDate: new Date('2025-08-01'), endDate: new Date('2026-06-30'), isCurrent: true },
    }))

  const cls = await prisma.class.create({
    data: { name: `TTClass-${suffix}`, level: 96, academicYearId: year.id, capacity: 40 },
  })
  classId = cls.id

  const a = await prisma.section.create({ data: { classId, name: 'A', capacity: 40, roomNo: 'R1' } })
  const b = await prisma.section.create({ data: { classId, name: 'B', capacity: 40, roomNo: 'R2' } })
  sectionId = a.id
  otherSectionId = b.id

  const s1 = await prisma.subject.create({
    data: { name: `TT-Subject1-${suffix}`, code: `T1${suffix}`, classId, isElective: false },
  })
  const s2 = await prisma.subject.create({
    data: { name: `TT-Subject2-${suffix}`, code: `T2${suffix}`, classId, isElective: false },
  })
  subjectId = s1.id
  otherSubjectId = s2.id

  const admin = await prisma.user.create({
    data: { email: `tt-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'TT Admin' },
  })
  createdUserIds.push(admin.id)

  const teacherUser = await prisma.user.create({
    data: { email: `tt-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'TT Teacher' },
  })
  createdUserIds.push(teacherUser.id)

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `TT-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 50000,
    },
  })
  teacherId = teacher.id

  const parentUser = await prisma.user.create({
    data: { email: `tt-parent-${suffix}@test.pk`, passwordHash, role: 'PARENT', name: 'TT Parent' },
  })
  createdUserIds.push(parentUser.id)
  const parentRecord = await prisma.parent.create({ data: { userId: parentUser.id, occupation: 'Tester' } })

  const studentUser = await prisma.user.create({
    data: { email: `tt-student-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'TT Student' },
  })
  createdUserIds.push(studentUser.id)

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `TTS-${suffix}`,
      rollNo: 'T1',
      dateOfBirth: new Date('2012-01-01'),
      gender: 'MALE',
      admissionDate: new Date('2025-08-01'),
      classId,
      status: 'ACTIVE',
    },
  })
  await prisma.enrollment.create({
    data: { studentId: student.id, classId, sectionId, academicYearId: year.id, rollNo: 'T1' },
  })
  await prisma.guardian.create({
    data: {
      studentId: student.id,
      parentId: parentRecord.id,
      name: 'TT Parent',
      relation: 'Father',
      phone: '+923001234567',
      isPrimary: true,
    },
  })

  adminToken = await login(`tt-admin-${suffix}@test.pk`)
  teacherToken = await login(`tt-teacher-${suffix}@test.pk`)
  studentToken = await login(`tt-student-${suffix}@test.pk`)
  parentToken = await login(`tt-parent-${suffix}@test.pk`)
})

afterAll(async () => {
  await prisma.timetableSlot.deleteMany({ where: { classId } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.$disconnect()
})

describe('timetable: options & empty grid', () => {
  it('admin loads editor options', async () => {
    const res = await request(app).get('/api/v1/timetable/options').set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const cls = res.body.data.classes.find((c: { id: string }) => c.id === classId)
    expect(cls).toBeDefined()
    expect(cls.sections).toHaveLength(2)
    expect(res.body.data.subjects.some((s: { id: string }) => s.id === subjectId)).toBe(true)
  })

  it('students cannot load options', async () => {
    const res = await request(app).get('/api/v1/timetable/options').set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(403)
  })

  it('empty section returns no slots', async () => {
    const res = await request(app)
      .get(`/api/v1/timetable/section/${sectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.slots).toHaveLength(0)
    expect(res.body.data.scope.sectionName).toBe('A')
  })
})

describe('timetable: slot CRUD & conflicts', () => {
  it('admin creates a slot', async () => {
    const res = await request(app)
      .post('/api/v1/timetable/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId,
        sectionId,
        subjectId,
        teacherId,
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '08:45',
        roomNo: 'R1',
      })
    expect(res.status).toBe(201)
    slotId = res.body.data.id
  })

  it('rejects a duplicate slot for the same section', async () => {
    const res = await request(app)
      .post('/api/v1/timetable/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classId, sectionId, subjectId: otherSubjectId, dayOfWeek: 'MONDAY', startTime: '08:00', endTime: '08:45' })
    expect(res.status).toBe(409)
    expect(res.body.error.message).toMatch(/already taken/i)
  })

  it('rejects booking a busy teacher elsewhere', async () => {
    const res = await request(app)
      .post('/api/v1/timetable/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        classId,
        sectionId: otherSectionId,
        subjectId,
        teacherId,
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '08:45',
      })
    expect(res.status).toBe(409)
    expect(res.body.error.message).toMatch(/already booked/i)
  })

  it('rejects end time before start time', async () => {
    const res = await request(app)
      .post('/api/v1/timetable/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classId, sectionId, subjectId, dayOfWeek: 'TUESDAY', startTime: '11:00', endTime: '10:00' })
    expect(res.status).toBe(400)
  })

  it('rejects a subject from another class', async () => {
    const otherClass = await prisma.class.create({
      data: { name: `Other-${suffix}`, level: 95, academicYearId: (await prisma.class.findUniqueOrThrow({ where: { id: classId } })).academicYearId, capacity: 10 },
    })
    const foreign = await prisma.subject.create({
      data: { name: `Foreign-${suffix}`, code: `F${suffix}`, classId: otherClass.id, isElective: false },
    })

    const res = await request(app)
      .post('/api/v1/timetable/slots')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classId, sectionId, subjectId: foreign.id, dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '09:45' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/does not belong/i)

    await prisma.subject.delete({ where: { id: foreign.id } })
    await prisma.class.delete({ where: { id: otherClass.id } })
  })

  it('teachers cannot edit the timetable', async () => {
    const res = await request(app)
      .post('/api/v1/timetable/slots')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ classId, sectionId, subjectId, dayOfWeek: 'THURSDAY', startTime: '10:00', endTime: '10:45' })
    expect(res.status).toBe(403)
  })

  it('admin updates a slot', async () => {
    const res = await request(app)
      .patch(`/api/v1/timetable/slots/${slotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roomNo: 'Lab-9', startTime: '08:15', endTime: '09:00' })

    expect(res.status).toBe(200)

    const grid = await request(app)
      .get(`/api/v1/timetable/section/${sectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(grid.body.data.slots[0].roomNo).toBe('Lab-9')
    expect(grid.body.data.slots[0].startTime).toBe('08:15')
  })
})

describe('timetable: scoped reads', () => {
  it('student sees their own section only', async () => {
    const own = await request(app)
      .get(`/api/v1/timetable/section/${sectionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(own.status).toBe(200)
    expect(own.body.data.slots).toHaveLength(1)

    const foreign = await request(app)
      .get(`/api/v1/timetable/section/${otherSectionId}`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(foreign.status).toBe(403)
  })

  it('parent sees their child’s section', async () => {
    const res = await request(app).get('/api/v1/timetable/me').set('Authorization', `Bearer ${parentToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.slots.length).toBe(1)
  })

  it('teacher sees their own schedule via /me', async () => {
    const res = await request(app).get('/api/v1/timetable/me').set('Authorization', `Bearer ${teacherToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.scope.kind).toBe('teacher')
    expect(res.body.data.slots).toHaveLength(1)
    expect(res.body.data.slots[0].className).toBe(`TTClass-${suffix}`)
  })

  it('a teacher cannot read another teacher’s timetable', async () => {
    const other = await prisma.teacher.findFirst({
      where: { id: { not: teacherId }, status: 'ACTIVE' },
      select: { id: true },
    })
    if (!other) return

    const res = await request(app)
      .get(`/api/v1/timetable/teacher/${other.id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
    expect(res.status).toBe(403)
  })

  it('today widget returns the current weekday', async () => {
    const res = await request(app).get('/api/v1/timetable/today').set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(200)
    expect(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']).toContain(res.body.data.day)
  })

  it('admin deletes the slot', async () => {
    const res = await request(app)
      .delete(`/api/v1/timetable/slots/${slotId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)

    const grid = await request(app)
      .get(`/api/v1/timetable/section/${sectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(grid.body.data.slots).toHaveLength(0)
  })
})
