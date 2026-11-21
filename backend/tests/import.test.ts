import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'
import { parseCsv, parseCsvTable } from '../src/utils/csv.js'

/**
 * Bulk CSV import.
 *
 * The dry run is the important half: a school imports in one shot, so it must
 * be possible to see every problem *before* a single account is created.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)
const PASSWORD = 'TestPass123'

let token = ''
let adminId = ''

const emails = [`imp1-${suffix}@test.pk`, `imp2-${suffix}@test.pk`]

function auth() {
  return { Authorization: `Bearer ${token}` }
}

beforeAll(async () => {
  const admin = await prisma.user.create({
    data: {
      email: `imp-admin-${suffix}@test.pk`,
      passwordHash: await hashPassword(PASSWORD),
      role: 'ADMIN',
      name: 'Import Admin',
    },
  })
  adminId = admin.id
  const login = await request(app).post('/api/v1/auth/login').send({ email: admin.email, password: PASSWORD })
  token = login.body.data.accessToken
})

afterAll(async () => {
  const users = await prisma.user.findMany({
    where: { email: { contains: suffix } },
    select: { id: true },
  })
  const ids = users.map((u) => u.id)
  await prisma.student.deleteMany({ where: { userId: { in: ids } } })
  await prisma.user.deleteMany({ where: { id: { in: ids } } })
  await prisma.$disconnect()
})

// ─────────────────────────────────────────────────────────────
//  Parser
// ─────────────────────────────────────────────────────────────
describe('csv parser', () => {
  it('handles quotes, escaped quotes and embedded commas', () => {
    const rows = parseCsv('a,b\n"x, y","he said ""hi"""\n')
    expect(rows).toEqual([
      ['a', 'b'],
      ['x, y', 'he said "hi"'],
    ])
  })

  it('handles CRLF and skips blank lines', () => {
    const rows = parseCsv('a,b\r\n1,2\r\n\r\n3,4\r\n')
    expect(rows).toEqual([
      ['a', 'b'],
      ['1', '2'],
      ['3', '4'],
    ])
  })

  it('normalises header names', () => {
    const table = parseCsvTable('Full Name,Date Of Birth\nHamza,2010-01-01')
    expect(table.headers).toEqual(['full_name', 'date_of_birth'])
    expect(table.rows[0]).toEqual({ full_name: 'Hamza', date_of_birth: '2010-01-01' })
  })

  it('strips a UTF-8 BOM (Excel writes one)', () => {
    const table = parseCsvTable('\uFEFFname,email\nA,a@b.pk')
    expect(table.headers[0]).toBe('name')
  })
})

// ─────────────────────────────────────────────────────────────
//  Import endpoint
// ─────────────────────────────────────────────────────────────
const HEADER = 'name,email,date_of_birth,gender,guardian_name,guardian_relation,guardian_phone'

describe('POST /students/import', () => {
  it('is admin-only', async () => {
    const res = await request(app)
      .post('/api/v1/students/import')
      .set(auth())
      .send({ csv: `${HEADER}\nAyesha Khan,a@b.pk,2010-01-01,MALE,Tariq Mahmood,Father,03001234567`, dryRun: true })
    // Admin token here; the RBAC branch is covered by the students suite, this
    // asserts the route exists and validates rather than 404ing.
    expect(res.status).toBe(200)
  })

  it('forbids non-admin roles', async () => {
    const teacher = await prisma.user.create({
      data: {
        email: `imp-teacher-${suffix}@test.pk`,
        passwordHash: await hashPassword(PASSWORD),
        role: 'TEACHER',
        name: 'Import Teacher',
        teacher: {
          create: {
            employeeNo: `IMP-${suffix}`,
            department: 'Science',
            designation: 'Teacher',
            joiningDate: new Date('2024-01-01'),
            baseSalary: 50000,
          },
        },
      },
    })
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: teacher.email, password: PASSWORD })

    const res = await request(app)
      .post('/api/v1/students/import')
      .set({ Authorization: `Bearer ${login.body.data.accessToken}` })
      .send({ csv: `${HEADER}\nAyesha Khan,a@b.pk,2010-01-01,MALE,Tariq Mahmood,Father,03001234567`, dryRun: true })

    expect(res.status).toBe(403)
  })

  it('rejects a CSV missing required columns', async () => {
    const res = await request(app)
      .post('/api/v1/students/import')
      .set(auth())
      .send({ csv: 'name,email\nA,a@b.pk', dryRun: true })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/missing required column/i)
  })

  it('rejects an empty CSV', async () => {
    const res = await request(app).post('/api/v1/students/import').set(auth()).send({ csv: '', dryRun: true })
    expect(res.status).toBe(400)
  })

  it('dry run reports row errors and writes nothing', async () => {
    const csv = [
      HEADER,
      `Good Learner,${emails[0]},2010-05-12,MALE,Tariq Mahmood,Father,03001234567`,
      `,,2010-05-12,MALE,Tariq Mahmood,Father,03001234567`,
      `Bad Email,not-an-email,2010-05-12,MALE,Tariq Mahmood,Father,03001234567`,
      `Future Child,fut-${suffix}@test.pk,2099-01-01,MALE,Tariq Mahmood,Father,03001234567`,
      `No Gender,ng-${suffix}@test.pk,2010-01-01,alien,Tariq Mahmood,Father,03001234567`,
    ].join('\n')

    const res = await request(app).post('/api/v1/students/import').set(auth()).send({ csv, dryRun: true })

    expect(res.status).toBe(200)
    const report = res.body.data
    expect(report.dryRun).toBe(true)
    expect(report.total).toBe(5)
    expect(report.imported).toBe(1)
    expect(report.skipped).toBe(4)
    expect(report.errors.map((e: { row: number }) => e.row)).toEqual([3, 4, 5, 6])

    // Nothing was created.
    const created = await prisma.user.findUnique({ where: { email: emails[0] } })
    expect(created).toBeNull()
  })

  it('detects duplicate emails inside the same file', async () => {
    const csv = [
      HEADER,
      `First Twin,dup-${suffix}@test.pk,2010-05-12,MALE,Tariq Mahmood,Father,03001234567`,
      `Second Twin,dup-${suffix}@test.pk,2010-05-12,FEMALE,Tariq Mahmood,Father,03001234567`,
    ].join('\n')

    const res = await request(app).post('/api/v1/students/import').set(auth()).send({ csv, dryRun: true })
    expect(res.body.data.imported).toBe(1)
    expect(res.body.data.errors[0].message).toMatch(/duplicate/i)
  })

  it('imports for real and creates accounts', async () => {
    const csv = [
      HEADER,
      `Imported One,${emails[0]},12/05/2010,MALE,Tariq Mahmood,Father,03001234567`,
      `Imported Two,${emails[1]},2011-06-06,female,Sana Bibi,Mother,03007654321`,
    ].join('\n')

    const res = await request(app).post('/api/v1/students/import').set(auth()).send({ csv, dryRun: false })

    expect(res.status).toBe(200)
    expect(res.body.data.imported).toBe(2)
    expect(res.body.data.skipped).toBe(0)

    const created = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true, role: true, student: { select: { admissionNo: true, gender: true } } },
    })
    expect(created).toHaveLength(2)
    expect(created.every((u) => u.role === 'STUDENT')).toBe(true)
    expect(created.every((u) => Boolean(u.student?.admissionNo))).toBe(true)
  })

  it('reports existing accounts instead of failing the whole file', async () => {
    const csv = [
      HEADER,
      `Imported One,${emails[0]},2010-05-12,MALE,Tariq Mahmood,Father,03001234567`,
      `New Person,imp3-${suffix}@test.pk,2010-05-12,MALE,Tariq Mahmood,Father,03001234567`,
    ].join('\n')

    const res = await request(app).post('/api/v1/students/import').set(auth()).send({ csv, dryRun: false })

    expect(res.body.data.imported).toBe(1)
    expect(res.body.data.skipped).toBe(1)
    expect(res.body.data.errors[0].email).toBe(emails[0])
  })

  it('enforces the password policy when a default password is supplied', async () => {
    const res = await request(app)
      .post('/api/v1/students/import')
      .set(auth())
      .send({ csv: `${HEADER}\nAyesha Khan,a@b.pk,2010-01-01,MALE,Tariq Mahmood,Father,03001234567`, dryRun: true, defaultPassword: 'weak' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
