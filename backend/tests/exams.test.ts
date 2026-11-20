import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/**
 * Exams & results — integration tests on the real database.
 * Builds a private class/section/subject/teacher/students.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''
let parentToken = ''

let classId = ''
let sectionId = ''
let subjectId = ''
let examId = ''
let studentIds: string[] = []
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
      data: { name: `Ex-${suffix}`, startDate: new Date('2025-08-01'), endDate: new Date('2026-06-30'), isCurrent: true },
    }))

  const cls = await prisma.class.create({
    data: { name: `ExamClass-${suffix}`, level: 97, academicYearId: year.id, capacity: 40 },
  })
  classId = cls.id
  const section = await prisma.section.create({ data: { classId, name: 'A', capacity: 40 } })
  sectionId = section.id

  const subject = await prisma.subject.create({
    data: { name: `ExamSubject-${suffix}`, code: `EX${suffix}`, classId, isElective: false },
  })
  subjectId = subject.id

  const admin = await prisma.user.create({
    data: { email: `ex-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'Exam Admin' },
  })
  createdUserIds.push(admin.id)

  const teacherUser = await prisma.user.create({
    data: { email: `ex-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'Exam Teacher' },
  })
  createdUserIds.push(teacherUser.id)

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeNo: `EX-${suffix}`,
      department: 'Testing',
      designation: 'Teacher',
      joiningDate: new Date('2024-01-01'),
      baseSalary: 50000,
    },
  })
  await prisma.subjectAssignment.create({ data: { subjectId, teacherId: teacher.id, sectionId } })

  const parentUser = await prisma.user.create({
    data: { email: `ex-parent-${suffix}@test.pk`, passwordHash, role: 'PARENT', name: 'Exam Parent' },
  })
  createdUserIds.push(parentUser.id)
  const parentRecord = await prisma.parent.create({ data: { userId: parentUser.id, occupation: 'Tester' } })

  const ids: string[] = []
  for (let i = 0; i < 4; i++) {
    const user = await prisma.user.create({
      data: {
        email: `ex-student-${i}-${suffix}@test.pk`,
        passwordHash,
        role: 'STUDENT',
        name: `Exam Student ${i}`,
      },
    })
    createdUserIds.push(user.id)

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNo: `EXS-${suffix}-${i}`,
        rollNo: `X${i}`,
        dateOfBirth: new Date('2012-01-01'),
        gender: 'MALE',
        admissionDate: new Date('2025-08-01'),
        classId,
        status: 'ACTIVE',
      },
    })
    await prisma.enrollment.create({
      data: { studentId: student.id, classId, sectionId, academicYearId: year.id, rollNo: `X${i}` },
    })

    if (i === 0) {
      await prisma.guardian.create({
        data: {
          studentId: student.id,
          parentId: parentRecord.id,
          name: 'Exam Parent',
          relation: 'Father',
          phone: '+923001234567',
          isPrimary: true,
        },
      })
    }
    ids.push(student.id)
  }
  studentIds = ids

  adminToken = await login(`ex-admin-${suffix}@test.pk`)
  teacherToken = await login(`ex-teacher-${suffix}@test.pk`)
  studentToken = await login(`ex-student-0-${suffix}@test.pk`)
  parentToken = await login(`ex-parent-${suffix}@test.pk`)
})

afterAll(async () => {
  await prisma.exam.deleteMany({ where: { classId } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.$disconnect()
})

describe('exams: scheduling', () => {
  it('admin schedules an exam', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Unit Test 1',
        type: 'UNIT_TEST',
        examDate: '2031-03-15',
        startTime: '09:00',
        totalMarks: 50,
        passingMarks: 20,
        classId,
        sectionId,
        subjectId,
      })

    expect(res.status).toBe(201)
    examId = res.body.data.id
  })

  it('rejects passing marks above total marks', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bad',
        type: 'QUIZ',
        examDate: '2031-03-16',
        totalMarks: 20,
        passingMarks: 40,
        classId,
        subjectId,
      })
    expect(res.status).toBe(400)
  })

  it('students cannot schedule exams', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'X', type: 'QUIZ', examDate: '2031-03-17', classId, subjectId })
    expect(res.status).toBe(403)
  })

  it('the teacher who teaches the subject can schedule', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Quiz 1', type: 'QUIZ', examDate: '2031-03-18', sectionId, subjectId, classId })
    expect(res.status).toBe(201)
    await request(app).delete(`/api/v1/exams/${res.body.data.id}`).set('Authorization', `Bearer ${adminToken}`)
  })
})

describe('exams: marks entry', () => {
  it('roster lists all enrolled students unmarked', async () => {
    const res = await request(app)
      .get(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.entries).toHaveLength(4)
    expect(res.body.data.stats.entered).toBe(0)
    expect(res.body.data.canEdit).toBe(true)
  })

  it('saves marks and computes grades', async () => {
    const marks = [45, 30, 10, 25]
    const res = await request(app)
      .post(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        entries: studentIds.map((studentId, i) => ({ studentId, marksObtained: marks[i] })),
      })

    expect(res.status).toBe(200)
    expect(res.body.data.saved).toBe(4)

    const roster = await request(app)
      .get(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)

    const byId = new Map<string, { studentId: string; marksObtained: number; grade: string }>(
      roster.body.data.entries.map((e: { studentId: string; marksObtained: number; grade: string }) => [
        e.studentId,
        e,
      ]),
    )
    // 45/50 = 90% → A+
    const first = byId.get(studentIds[0]!)
    expect(first?.marksObtained).toBe(45)
    expect(first?.grade).toBe('A+')
  })

  it('replaces marks on re-save (upsert)', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ entries: [{ studentId: studentIds[0], marksObtained: 20 }] })

    expect(res.status).toBe(200)
    expect(res.body.data.saved).toBe(1)

    const roster = await request(app)
      .get(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
    const entry = roster.body.data.entries.find(
      (e: { studentId: string; marksObtained: number; grade: string }) => e.studentId === studentIds[0],
    )
    expect(entry?.marksObtained).toBe(20)
    expect(entry?.grade).toBe('E') // 40% → E
  })

  it('rejects marks above the total', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ entries: [{ studentId: studentIds[0], marksObtained: 999 }] })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/exceed/i)
  })

  it('null marks remove a result', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ entries: [{ studentId: studentIds[3], marksObtained: null }] })

    expect(res.status).toBe(200)
    expect(res.body.data.removed).toBe(1)
  })
})

describe('exams: analysis & publishing', () => {
  it('analysis reports distribution and toppers', async () => {
    const res = await request(app)
      .get(`/api/v1/exams/${examId}/analysis`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.count).toBeGreaterThan(0)
    expect(res.body.data.average).not.toBeNull()
    expect(res.body.data.toppers.length).toBeGreaterThan(0)
    expect(Object.keys(res.body.data.bands)).toContain('A+')
  })

  it('cannot publish without results', async () => {
    const empty = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Empty', type: 'QUIZ', examDate: '2031-04-01', classId, sectionId, subjectId })

    const res = await request(app)
      .patch(`/api/v1/exams/${empty.body.data.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/at least one result/i)
    await request(app).delete(`/api/v1/exams/${empty.body.data.id}`).set('Authorization', `Bearer ${adminToken}`)
  })

  it('teacher cannot publish results', async () => {
    const res = await request(app)
      .patch(`/api/v1/exams/${examId}/status`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'PUBLISHED' })
    expect(res.status).toBe(403)
  })

  it('student cannot see results before publishing', async () => {
    const res = await request(app)
      .get('/api/v1/results?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)
    expect(res.body.data.every((r: { examId: string }) => r.examId !== examId)).toBe(true)
  })

  it('admin publishes, then learners can see their results', async () => {
    const publish = await request(app)
      .patch(`/api/v1/exams/${examId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PUBLISHED' })
    expect(publish.status).toBe(200)
    expect(publish.body.data.status).toBe('PUBLISHED')

    const res = await request(app)
      .get('/api/v1/results?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    const mine = res.body.data.filter((r: { examId: string }) => r.examId === examId)
    expect(mine.length).toBe(1)
    expect(mine[0].studentId).toBe(studentIds[0])
  })

  it('marks are locked once published', async () => {
    const res = await request(app)
      .post(`/api/v1/exams/${examId}/marks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ entries: [{ studentId: studentIds[0], marksObtained: 30 }] })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/already published/i)
  })
})

describe('exams: transcript & scoping', () => {
  it('student transcript groups results by exam', async () => {
    const res = await request(app)
      .get('/api/v1/results/transcript')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.student.id).toBe(studentIds[0])
    const exam = res.body.data.exams.find((e: { examId: string }) => e.examId === examId)
    expect(exam).toBeDefined()
    expect(exam.percent).toBe(40) // 20/50
    expect(exam.grade).toBe('E')
  })

  it('parent transcript shows the linked child', async () => {
    const res = await request(app)
      .get('/api/v1/results/transcript')
      .set('Authorization', `Bearer ${parentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.student.id).toBe(studentIds[0])
  })

  it('a student cannot read another student’s transcript', async () => {
    const res = await request(app)
      .get(`/api/v1/results/transcript?studentId=${studentIds[1]}`)
      .set('Authorization', `Bearer ${studentToken}`)

    // the service forces the actor's own studentId
    expect(res.body.data.student.id).toBe(studentIds[0])
  })

  it('teacher only sees results for their sections/subjects', async () => {
    const res = await request(app)
      .get('/api/v1/results?limit=50')
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data.every((r: { subjectName: string }) => r.subjectName === `ExamSubject-${suffix}`)).toBe(true)
  })
})
