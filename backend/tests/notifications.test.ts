import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/** Notifications module — audience targeting, per-user read state, composer RBAC. */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''
let parentToken = ''

let classId = ''
let otherClassId = ''
let ownNoticeId = ''
let classNoticeId = ''
let otherClassNoticeId = ''

const createdUserIds: string[] = []
const createdNotificationIds: string[] = []

async function login(email: string) {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password: 'TestPass123' })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

async function compose(token: string, body: Record<string, unknown>) {
  const res = await request(app)
    .post('/api/v1/notifications')
    .set('Authorization', `Bearer ${token}`)
    .send(body)
  if (res.status === 201) createdNotificationIds.push(res.body.data.id)
  return res
}

beforeAll(async () => {
  const passwordHash = await hashPassword('TestPass123')
  const year =
    (await prisma.academicYear.findFirst({ where: { isCurrent: true } })) ??
    (await prisma.academicYear.create({
      data: {
        name: `NT-${suffix}`,
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-06-30'),
        isCurrent: true,
      },
    }))

  const cls = await prisma.class.create({
    data: { name: `NTClass-${suffix}`, level: 94, academicYearId: year.id, capacity: 30 },
  })
  const other = await prisma.class.create({
    data: { name: `NTClassB-${suffix}`, level: 93, academicYearId: year.id, capacity: 30 },
  })
  classId = cls.id
  otherClassId = other.id

  const section = await prisma.section.create({ data: { classId, name: 'A', capacity: 30 } })

  const admin = await prisma.user.create({
    data: { email: `nt-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'NT Admin' },
  })
  const teacherUser = await prisma.user.create({
    data: { email: `nt-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'NT Teacher' },
  })
  const studentUser = await prisma.user.create({
    data: { email: `nt-student-${suffix}@test.pk`, passwordHash, role: 'STUDENT', name: 'NT Student' },
  })
  const parentUser = await prisma.user.create({
    data: { email: `nt-parent-${suffix}@test.pk`, passwordHash, role: 'PARENT', name: 'NT Parent' },
  })
  createdUserIds.push(admin.id, teacherUser.id, studentUser.id, parentUser.id)

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `NT-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 60000,
    },
  })

  // the teacher "owns" this class through a timetable slot
  const subject = await prisma.subject.create({
    data: { name: `NT-Subject-${suffix}`, code: `NT${suffix}`, classId, isElective: false },
  })
  await prisma.timetableSlot.create({
    data: {
      classId,
      sectionId: section.id,
      subjectId: subject.id,
      teacherId: teacher.id,
      dayOfWeek: 'MONDAY',
      startTime: '09:00',
      endTime: '09:45',
    },
  })

  const parentRecord = await prisma.parent.create({ data: { userId: parentUser.id, occupation: 'Tester' } })
  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `NTS-${suffix}`,
      rollNo: 'N1',
      dateOfBirth: new Date('2012-01-01'),
      gender: 'MALE',
      admissionDate: new Date('2025-08-01'),
      classId,
      status: 'ACTIVE',
    },
  })
  await prisma.enrollment.create({
    data: { studentId: student.id, classId, sectionId: section.id, academicYearId: year.id, rollNo: 'N1' },
  })
  await prisma.guardian.create({
    data: {
      studentId: student.id,
      parentId: parentRecord.id,
      name: 'NT Parent',
      relation: 'Father',
      phone: '+923001112223',
      isPrimary: true,
    },
  })

  adminToken = await login(`nt-admin-${suffix}@test.pk`)
  teacherToken = await login(`nt-teacher-${suffix}@test.pk`)
  studentToken = await login(`nt-student-${suffix}@test.pk`)
  parentToken = await login(`nt-parent-${suffix}@test.pk`)

  ownNoticeId = (await compose(adminToken, {
    title: `NT broad ${suffix}`,
    body: 'Everyone should see this notice.',
    audience: 'ALL',
  })).body.data.id

  classNoticeId = (await compose(adminToken, {
    title: `NT class ${suffix}`,
    body: 'Only the target class sees this notice.',
    audience: 'CLASS',
    classId,
  })).body.data.id

  otherClassNoticeId = (await compose(adminToken, {
    title: `NT other class ${suffix}`,
    body: 'A different class should not see this notice.',
    audience: 'CLASS',
    classId: otherClassId,
  })).body.data.id
})

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { id: { in: createdNotificationIds } } })
  await prisma.timetableSlot.deleteMany({ where: { classId } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { id: { in: [classId, otherClassId] } } })
  await prisma.$disconnect()
})

describe('notifications: audience targeting', () => {
  it('broad ALL notices reach every role', async () => {
    for (const token of [adminToken, teacherToken, studentToken, parentToken]) {
      const res = await request(app)
        .get('/api/v1/notifications?limit=50')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body.data.some((n: { id: string }) => n.id === ownNoticeId)).toBe(true)
    }
  })

  it('CLASS notices reach the class’s student and parent', async () => {
    const student = await request(app)
      .get('/api/v1/notifications?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(student.body.data.some((n: { id: string }) => n.id === classNoticeId)).toBe(true)

    const parent = await request(app)
      .get('/api/v1/notifications?limit=50')
      .set('Authorization', `Bearer ${parentToken}`)
    expect(parent.body.data.some((n: { id: string }) => n.id === classNoticeId)).toBe(true)
  })

  it('CLASS notices for another class stay hidden', async () => {
    const res = await request(app)
      .get('/api/v1/notifications?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.body.data.some((n: { id: string }) => n.id === otherClassNoticeId)).toBe(false)
  })

  it('cannot open a notice outside your audience', async () => {
    const res = await request(app)
      .get(`/api/v1/notifications/${otherClassNoticeId}`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(404)
  })
})

describe('notifications: read receipts', () => {
  it('new notices start unread', async () => {
    const res = await request(app)
      .get(`/api/v1/notifications/${ownNoticeId}`)
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.isRead).toBe(false)
  })

  it('unread count drops after marking one read', async () => {
    const before = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(before.body.data.unread).toBeGreaterThan(0)

    const mark = await request(app)
      .patch(`/api/v1/notifications/${ownNoticeId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ read: true })
    expect(mark.status).toBe(200)
    expect(mark.body.data.isRead).toBe(true)
    expect(mark.body.data.readAt).toBeTruthy()

    const after = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(after.body.data.unread).toBe(before.body.data.unread - 1)
  })

  it('read state is per user', async () => {
    const parent = await request(app)
      .get(`/api/v1/notifications/${ownNoticeId}`)
      .set('Authorization', `Bearer ${parentToken}`)
    expect(parent.body.data.isRead).toBe(false)
  })

  it('mark-all-read clears the inbox', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.marked).toBeGreaterThanOrEqual(0)

    const unread = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(unread.body.data.unread).toBe(0)
  })

  it('marking unread again restores the badge', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${ownNoticeId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ read: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isRead).toBe(false)
  })
})

describe('notifications: composing', () => {
  it('teacher can message their own class’s students', async () => {
    const res = await compose(teacherToken, {
      title: `NT teacher class ${suffix}`,
      body: 'Homework is due on Sunday, bring your notebooks.',
      audience: 'CLASS',
      classId,
    })
    expect(res.status).toBe(201)

    const student = await request(app)
      .get('/api/v1/notifications?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(student.body.data.some((n: { id: string }) => n.id === res.body.data.id)).toBe(true)
  })

  it('teacher cannot broadcast to ALL', async () => {
    const res = await compose(teacherToken, {
      title: `NT forbidden ${suffix}`,
      body: 'This should be rejected.',
      audience: 'ALL',
    })
    expect(res.status).toBe(403)
  })

  it('teacher cannot post to a class they do not teach', async () => {
    const res = await compose(teacherToken, {
      title: `NT foreign class ${suffix}`,
      body: 'Not your class.',
      audience: 'CLASS',
      classId: otherClassId,
    })
    expect(res.status).toBe(403)
  })

  it('students cannot compose', async () => {
    const res = await compose(studentToken, {
      title: `NT nope ${suffix}`,
      body: 'Learners cannot send notices.',
      audience: 'STUDENTS',
    })
    expect(res.status).toBe(403)
  })

  it('CLASS notices require a class', async () => {
    const res = await compose(adminToken, {
      title: `NT no class ${suffix}`,
      body: 'Missing the class id.',
      audience: 'CLASS',
    })
    expect(res.status).toBe(400)
  })

  it('validates the title', async () => {
    const res = await compose(adminToken, { title: 'ab', body: 'Too short a title.', audience: 'ALL' })
    expect(res.status).toBe(400)
  })

  it('composer options are scoped to the teacher’s classes', async () => {
    const teacher = await request(app)
      .get('/api/v1/notifications/options')
      .set('Authorization', `Bearer ${teacherToken}`)
    expect(teacher.status).toBe(200)
    expect(teacher.body.data.classes.some((c: { id: string }) => c.id === classId)).toBe(true)
    expect(teacher.body.data.classes.some((c: { id: string }) => c.id === otherClassId)).toBe(false)
    expect(teacher.body.data.audiences).not.toContain('ALL')
  })

  it('learners cannot load composer options', async () => {
    const res = await request(app)
      .get('/api/v1/notifications/options')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.status).toBe(403)
  })
})

describe('notifications: moderation & stats', () => {
  it('teacher cannot delete someone else’s notice', async () => {
    const res = await request(app)
      .delete(`/api/v1/notifications/${classNoticeId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
    expect(res.status).toBe(403)
  })

  it('admin deletes a notice and it disappears for learners', async () => {
    const temp = await compose(adminToken, {
      title: `NT temp ${suffix}`,
      body: 'Will be removed in this test.',
      audience: 'STUDENTS',
    })
    const id = temp.body.data.id as string

    const del = await request(app)
      .delete(`/api/v1/notifications/${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(del.status).toBe(204)

    const student = await request(app)
      .get('/api/v1/notifications?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(student.body.data.some((n: { id: string }) => n.id === id)).toBe(false)
  })

  it('admin sees delivery stats, learners do not', async () => {
    const admin = await request(app)
      .get('/api/v1/notifications/stats')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(admin.status).toBe(200)
    expect(admin.body.data.total).toBeGreaterThan(0)
    expect(Array.isArray(admin.body.data.recent)).toBe(true)

    const learner = await request(app)
      .get('/api/v1/notifications/stats')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(learner.status).toBe(403)
  })

  it('supports search and audience filters', async () => {
    const search = await request(app)
      .get(`/api/v1/notifications?search=NT%20broad%20${suffix}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(search.status).toBe(200)
    expect(search.body.data.length).toBe(1)
    expect(search.body.data[0].id).toBe(ownNoticeId)

    const byAudience = await request(app)
      .get('/api/v1/notifications?audience=CLASS&limit=50')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(
      byAudience.body.data.every((n: { audience: string }) => n.audience === 'CLASS'),
    ).toBe(true)
  })
})
