import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

/** User directory, credential resets, settings and derived alerts. */

const app = createApp()
const suffix = Date.now().toString().slice(-6)

let adminToken = ''
let teacherToken = ''
const createdUserIds: string[] = []
let createdUserId = ''

const auth = (token: string) => ({ Authorization: `Bearer ${token}` })

async function login(email: string, password = 'AdminTest123') {
  const res = await request(app).post('/api/v1/auth/login').send({ email, password })
  expect(res.status).toBe(200)
  return res.body.data.accessToken as string
}

beforeAll(async () => {
  const passwordHash = await hashPassword('AdminTest123')
  const admin = await prisma.user.create({
    data: { email: `adm-${suffix}@test.pk`, passwordHash, role: 'ADMIN', name: 'Directory Admin' },
  })
  const teacher = await prisma.user.create({
    data: { email: `admt-${suffix}@test.pk`, passwordHash, role: 'TEACHER', name: 'Directory Teacher' },
  })
  createdUserIds.push(admin.id, teacher.id)

  adminToken = await login(`adm-${suffix}@test.pk`)
  teacherToken = await login(`admt-${suffix}@test.pk`)
})

afterAll(async () => {
  if (createdUserId) await prisma.user.deleteMany({ where: { id: createdUserId } })
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } })
  await prisma.schoolSetting.deleteMany({ where: { key: { startsWith: 'test.' } } })
  await prisma.$disconnect()
})

describe('admin: access control', () => {
  it('teachers cannot read the directory', async () => {
    const res = await request(app).get('/api/v1/admin/users').set(auth(teacherToken))
    expect(res.status).toBe(403)
  })

  it('anonymous requests are rejected', async () => {
    const res = await request(app).get('/api/v1/admin/users')
    expect(res.status).toBe(401)
  })
})

describe('admin: directory', () => {
  it('lists users with stats and pagination', async () => {
    const res = await request(app).get('/api/v1/admin/users?limit=5').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeLessThanOrEqual(5)
    expect(res.body.meta.total).toBeGreaterThan(0)
    expect(typeof res.body.stats.total).toBe('number')
  })

  it('filters by role', async () => {
    const res = await request(app).get('/api/v1/admin/users?role=ADMIN&limit=100').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.every((user: { role: string }) => user.role === 'ADMIN')).toBe(true)
  })

  it('creates a user and rejects the duplicate email', async () => {
    const email = `new-${suffix}@test.pk`
    const res = await request(app)
      .post('/api/v1/admin/users')
      .set(auth(adminToken))
      .send({ name: 'New Person', email, password: 'Password123', role: 'STUDENT' })

    expect(res.status).toBe(201)
    expect(res.body.data.role).toBe('STUDENT')
    createdUserId = res.body.data.id

    const duplicate = await request(app)
      .post('/api/v1/admin/users')
      .set(auth(adminToken))
      .send({ name: 'New Person', email, password: 'Password123', role: 'STUDENT' })
    expect(duplicate.status).toBe(400)
  })

  it('validates the payload', async () => {
    const res = await request(app)
      .post('/api/v1/admin/users')
      .set(auth(adminToken))
      .send({ name: 'X', email: 'not-an-email', password: 'short', role: 'WIZARD' })
    expect(res.status).toBe(400)
  })

  it('suspends and reactivates an account', async () => {
    const suspend = await request(app)
      .patch(`/api/v1/admin/users/${createdUserId}/status`)
      .set(auth(adminToken))
      .send({ status: 'SUSPENDED' })
    expect(suspend.status).toBe(200)
    expect(suspend.body.data.status).toBe('SUSPENDED')

    const blocked = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `new-${suffix}@test.pk`, password: 'Password123' })
    expect(blocked.status).toBeGreaterThanOrEqual(400)

    const reactivate = await request(app)
      .patch(`/api/v1/admin/users/${createdUserId}/status`)
      .set(auth(adminToken))
      .send({ status: 'ACTIVE' })
    expect(reactivate.status).toBe(200)
  })

  it('refuses to change your own status', async () => {
    const admin = await prisma.user.findUniqueOrThrow({
      where: { email: `adm-${suffix}@test.pk` },
      select: { id: true },
    })
    const res = await request(app)
      .patch(`/api/v1/admin/users/${admin.id}/status`)
      .set(auth(adminToken))
      .send({ status: 'SUSPENDED' })
    expect(res.status).toBe(400)
  })

  it('issues a working password reset', async () => {
    const res = await request(app)
      .post(`/api/v1/admin/users/${createdUserId}/reset-password`)
      .set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(typeof res.body.data.password).toBe('string')

    const signIn = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `new-${suffix}@test.pk`, password: res.body.data.password })
    expect(signIn.status).toBe(200)
  })

  it('404s for an unknown user', async () => {
    const res = await request(app)
      .post('/api/v1/admin/users/nope/reset-password')
      .set(auth(adminToken))
    expect(res.status).toBe(404)
  })
})

describe('admin: settings', () => {
  it('returns the known keys with a source', async () => {
    const res = await request(app).get('/api/v1/admin/settings').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(res.body.data.length).toBeGreaterThan(0)
    for (const entry of res.body.data) {
      expect(['database', 'default']).toContain(entry.source)
      expect(typeof entry.key).toBe('string')
    }
  })

  it('rejects unknown keys', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/settings')
      .set(auth(adminToken))
      .send({ updates: [{ key: 'test.junk', value: 'x' }] })
    expect(res.status).toBe(400)
  })

  it('persists a valid update', async () => {
    const res = await request(app)
      .patch('/api/v1/admin/settings')
      .set(auth(adminToken))
      .send({ updates: [{ key: 'finance.currency', value: 'PKR' }] })
    expect(res.status).toBe(200)
    const currency = res.body.data.find((entry: { key: string }) => entry.key === 'finance.currency')
    expect(currency.value).toBe('PKR')
    expect(currency.source).toBe('database')
  })
})

describe('admin: alerts', () => {
  it('derives alerts with a summary', async () => {
    const res = await request(app).get('/api/v1/admin/alerts').set(auth(adminToken))
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.alerts)).toBe(true)
    const { critical, warning, info } = res.body.data.summary
    expect(critical + warning + info).toBe(res.body.data.alerts.length)
    for (const alert of res.body.data.alerts) {
      expect(['critical', 'warning', 'info']).toContain(alert.severity)
      expect(alert.href.startsWith('/admin/')).toBe(true)
    }
  })

  it('teachers are refused', async () => {
    const res = await request(app).get('/api/v1/admin/alerts').set(auth(teacherToken))
    expect(res.status).toBe(403)
  })
})
