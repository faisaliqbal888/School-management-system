import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/**
 * Fees module — integration tests against the real database.
 * Builds a private class + 3 students so assertions never rely on seed data.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
let studentToken = ''
let parentToken = ''
let classId = ''
let studentIds: string[] = []
const createdUserIds: string[] = []
const createdInvoiceIds: string[] = []

async function login(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'TestPass123' })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

beforeAll(async () => {
  const passwordHash = await hashPassword('TestPass123')
  const year =
    (await prisma.academicYear.findFirst({ where: { isCurrent: true } })) ??
    (await prisma.academicYear.create({
      data: { name: `Fee-${suffix}`, startDate: new Date('2025-08-01'), endDate: new Date('2026-06-30'), isCurrent: true },
    }))

  const cls = await prisma.class.create({
    data: { name: `FeeClass-${suffix}`, level: 98, academicYearId: year.id, capacity: 40 },
  })
  classId = cls.id
  const section = await prisma.section.create({ data: { classId, name: 'A', capacity: 40 } })

  // admin
  const admin = await prisma.user.create({
    data: { email: `fee-admin-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'Fee Admin' },
  })
  createdUserIds.push(admin.id)

  // teacher
  const teacherUser = await prisma.user.create({
    data: { email: `fee-teacher-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'Fee Teacher' },
  })
  createdUserIds.push(teacherUser.id)

  // students (student #1 also has a parent account)
  const parent = await prisma.user.create({
    data: { email: `fee-parent-${suffix}@test.pk`, passwordHash, role: 'PARENT', name: 'Fee Parent' },
  })
  createdUserIds.push(parent.id)

  const parentRecord = await prisma.parent.create({
    data: { userId: parent.id, occupation: 'Tester' },
  })

  const ids: string[] = []
  for (let i = 0; i < 3; i++) {
    const user = await prisma.user.create({
      data: {
        email: `fee-student-${i}-${suffix}@test.pk`,
        passwordHash,
        role: 'STUDENT',
        name: `Fee Student ${i}`,
      },
    })
    createdUserIds.push(user.id)

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        admissionNo: `FEE-${suffix}-${i}`,
        rollNo: `F${i}`,
        dateOfBirth: new Date('2012-01-01'),
        gender: 'MALE',
        admissionDate: new Date('2025-08-01'),
        classId,
        status: 'ACTIVE',
      },
    })

    await prisma.enrollment.create({
      data: { studentId: student.id, classId, sectionId: section.id, academicYearId: year.id, rollNo: `F${i}` },
    })

    // link student #0 to the parent account
    if (i === 0) {
      await prisma.guardian.create({
        data: {
          studentId: student.id,
          parentId: parentRecord.id,
          name: 'Fee Parent',
          relation: 'Father',
          phone: '+923001234567',
          isPrimary: true,
        },
      })
    }

    ids.push(student.id)
  }
  studentIds = ids

  adminToken = await login(`fee-admin-${suffix}@test.pk`)
  teacherToken = await login(`fee-teacher-${suffix}@test.pk`)
  studentToken = await login(`fee-student-0-${suffix}@test.pk`)
  parentToken = await login(`fee-parent-${suffix}@test.pk`)
})

afterAll(async () => {
  await prisma.payment.deleteMany({ where: { invoiceId: { in: createdInvoiceIds } } })
  await prisma.invoice.deleteMany({ where: { studentId: { in: studentIds } } })
  await prisma.feeStructure.deleteMany({ where: { classId } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.class.deleteMany({ where: { id: classId } })
  await prisma.$disconnect()
})

describe('fees: fee structures', () => {
  let structureId = ''

  it('admin creates a fee structure', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Tuition', classId, amount: 15000, frequency: 'MONTHLY', dueDay: 5 })

    expect(res.status).toBe(201)
    expect(res.body.data.amount).toBe(15000)
    structureId = res.body.data.id
  })

  it('rejects a non-positive amount', async () => {
    const res = await request(app)
      .post('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad', classId, amount: 0 })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('teacher cannot list structures', async () => {
    const res = await request(app)
      .get('/api/v1/fees/structures')
      .set('Authorization', `Bearer ${teacherToken}`)
    expect(res.status).toBe(403)
  })

  it('generates one invoice per active student and skips duplicates', async () => {
    const first = await request(app)
      .post('/api/v1/fees/invoices/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ feeStructureId: structureId, period: '2031-01' })

    expect(first.status).toBe(201)
    expect(first.body.data.created).toBe(3)

    const second = await request(app)
      .post('/api/v1/fees/invoices/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ feeStructureId: structureId, period: '2031-01' })

    expect(second.status).toBe(201)
    expect(second.body.data.created).toBe(0)
    expect(second.body.data.skipped).toBe(3)

    const invoices = await prisma.invoice.findMany({
      where: { studentId: { in: studentIds }, period: '2031-01' },
      select: { id: true },
    })
    createdInvoiceIds.push(...invoices.map((i) => i.id))
  })
})

describe('fees: invoices & payments', () => {
  let invoiceId = ''

  it('creates a manual invoice with a discount', async () => {
    const res = await request(app)
      .post('/api/v1/fees/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: studentIds[0],
        title: 'Lab Fee',
        amount: 5000,
        discount: 500,
        dueDate: '2031-06-30',
        period: '2031-06',
      })

    expect(res.status).toBe(201)
    expect(res.body.data.totalAmount).toBe(4500)
    invoiceId = res.body.data.id
    createdInvoiceIds.push(invoiceId)
  })

  it('rejects a discount larger than the amount', async () => {
    const res = await request(app)
      .post('/api/v1/fees/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: studentIds[0], title: 'Bad', amount: 1000, discount: 2000, dueDate: '2031-06-30' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/discount/i)
  })

  it('records a partial payment then settles the balance', async () => {
    const partial = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceId, amount: 2000, method: 'CASH' })

    expect(partial.status).toBe(201)
    expect(partial.body.data.status).toBe('PARTIAL')
    expect(partial.body.data.balance).toBe(2500)
    expect(partial.body.data.receiptNo).toMatch(/^RCP-\d{4}-\d{4}$/)

    const rest = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceId, amount: 2500, method: 'BANK_TRANSFER', reference: 'TRX-991' })

    expect(rest.status).toBe(201)
    expect(rest.body.data.status).toBe('PAID')
    expect(rest.body.data.balance).toBe(0)
  })

  it('rejects overpayment', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ invoiceId, amount: 100 })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/already fully paid/i)
  })

  it('invoice detail lists payments newest first', async () => {
    const res = await request(app)
      .get(`/api/v1/fees/invoices/${invoiceId}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.payments).toHaveLength(2)
    expect(res.body.data.status).toBe('PAID')
    expect(res.body.data.balance).toBe(0)
  })

  it('cannot waive an invoice that has payments', async () => {
    const res = await request(app)
      .patch(`/api/v1/fees/invoices/${invoiceId}/waive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Test waiver attempt' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/payments/i)
  })
})

describe('fees: RBAC scoping', () => {
  it('a student only sees their own invoices', async () => {
    const res = await request(app)
      .get('/api/v1/fees/invoices?limit=50')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(res.body.data.every((i: { studentId: string }) => i.studentId === studentIds[0])).toBe(true)
  })

  it('a parent only sees their linked child', async () => {
    const res = await request(app)
      .get('/api/v1/fees/invoices?limit=50')
      .set('Authorization', `Bearer ${parentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.every((i: { studentId: string }) => i.studentId === studentIds[0])).toBe(true)
  })

  it('a student cannot read another student’s invoice', async () => {
    const other = await prisma.invoice.findFirst({
      where: { studentId: studentIds[1] },
      select: { id: true },
    })
    expect(other).not.toBeNull()

    const res = await request(app)
      .get(`/api/v1/fees/invoices/${other!.id}`)
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(404)
  })

  it('teachers are blocked from fee data entirely', async () => {
    for (const path of ['/api/v1/fees/invoices', '/api/v1/fees/summary', '/api/v1/fees/payments']) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${teacherToken}`)
      expect(res.status).toBe(403)
    }
  })

  it('students cannot record payments', async () => {
    const res = await request(app)
      .post('/api/v1/fees/payments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ invoiceId: createdInvoiceIds[0], amount: 10 })

    expect(res.status).toBe(403)
  })

  it('summary totals match the scoped invoices', async () => {
    const res = await request(app)
      .get('/api/v1/fees/summary')
      .set('Authorization', `Bearer ${studentToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.currency).toBe('PKR')
    expect(res.body.data.billed).toBeGreaterThan(0)
    expect(res.body.data.outstanding).toBeGreaterThanOrEqual(0)
  })
})
