import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'
import { hashToken } from '../src/utils/jwt.js'

const app = createApp()

const EMAIL = `sec-${Date.now()}@test.pk`
const OTHER_EMAIL = `sec2-${Date.now()}@test.pk`
const PASSWORD = 'SecTest2026x'
const STRONG = 'Br4ndNewPolicy'

let userId = ''
let otherId = ''

async function makeUser(email: string, name: string) {
  return prisma.user.create({
    data: { email, passwordHash: await hashPassword(PASSWORD), role: 'STUDENT', name },
  })
}

beforeAll(async () => {
  userId = (await makeUser(EMAIL, 'Security Test')).id
  otherId = (await makeUser(OTHER_EMAIL, 'Security Other')).id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL, OTHER_EMAIL] } } })
  await prisma.$disconnect()
})

describe('security: brute-force lockout', () => {
  it('locks the account after five wrong passwords and reports it', async () => {
    for (let i = 0; i < 4; i += 1) {
      const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: 'wrong' })
      expect(res.status).toBe(401)
      expect(res.body.error.message).toBe('Invalid email or password')
    }

    const lock = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: 'wrong' })
    expect(lock.status).toBe(401)
    expect(lock.body.error.message).toMatch(/locked/i)

    // Even the correct password is refused while the lock stands.
    const blocked = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    expect(blocked.status).toBe(401)
    expect(blocked.body.error.message).toMatch(/failed attempts/i)

    const stored = await prisma.user.findUnique({ where: { id: userId } })
    expect(stored?.failedLoginAttempts).toBeGreaterThanOrEqual(5)
    expect(stored?.lockedUntil).toBeTruthy()
  })

  it('writes an audit entry for the lockout', async () => {
    const entry = await prisma.auditLog.findFirst({
      where: { userId, action: 'auth.lockout' },
      orderBy: { createdAt: 'desc' },
    })
    expect(entry).toBeTruthy()
  })

  it('clears the counter after a successful sign-in once the lock expires', async () => {
    // Simulate an elapsed lock rather than waiting 15 minutes.
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    })

    const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    expect(res.status).toBe(200)

    const stored = await prisma.user.findUnique({ where: { id: userId } })
    expect(stored?.failedLoginAttempts).toBe(0)
    expect(stored?.lockedUntil).toBeNull()
  })

  it('does not reveal whether an unknown email exists', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: `ghost-${Date.now()}@test.pk`, password: 'whatever' })
    expect(res.status).toBe(401)
    expect(res.body.error.message).toBe('Invalid email or password')
  })
})

describe('security: password policy', () => {
  async function tokenFor(email = EMAIL) {
    const login = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD })
    return login.body.data.accessToken as string
  }

  it.each([
    ['too short', 'Ab1'],
    ['no uppercase', 'lowercase123'],
    ['no digit', 'NoDigitsHere'],
    ['common password', 'password123'],
  ])('rejects a new password that is %s', async (_label, candidate) => {
    const token = await tokenFor()
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword: candidate, confirmPassword: candidate })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('applies the same policy to admin-created accounts', async () => {
    const admin = await prisma.user.create({
      data: {
        email: `sec-admin-${Date.now()}@test.pk`,
        passwordHash: await hashPassword(PASSWORD),
        role: 'ADMIN',
        name: 'Security Admin',
      },
    })
    try {
      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: admin.email, password: PASSWORD })
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`)
        .send({ name: 'Weak User', email: `weak-${Date.now()}@test.pk`, password: 'weak', role: 'STUDENT' })
      expect(res.status).toBe(400)
    } finally {
      await prisma.user.delete({ where: { id: admin.id } })
    }
  })

  it('revokes every session when the password changes', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const token = login.body.data.accessToken
    const otherSession = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })

    const changed = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: PASSWORD, newPassword: STRONG, confirmPassword: STRONG })
    expect(changed.status).toBe(200)

    // The other device's refresh token is dead.
    const reuse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: otherSession.body.data.refreshToken })
    expect(reuse.status).toBe(401)

    // Put the original password back for the remaining tests.
    const fresh = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: STRONG })
    await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${fresh.body.data.accessToken}`)
      .send({ currentPassword: STRONG, newPassword: PASSWORD, confirmPassword: PASSWORD })
  })
})

describe('security: sessions & profile', () => {
  it('lists active sessions without leaking token hashes', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const res = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.data.length).toBeGreaterThan(0)
    expect(JSON.stringify(res.body)).not.toContain('tokenHash')
  })

  it('cannot revoke another user’s session', async () => {
    const mine = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    // A live session for the other user must exist, but the token itself is unused.
    await request(app).post('/api/v1/auth/login').send({ email: OTHER_EMAIL, password: PASSWORD })

    const otherSessionId = (
      await prisma.refreshToken.findFirst({
        where: { userId: otherId, revokedAt: null },
        select: { id: true },
      })
    )?.id
    expect(otherSessionId).toBeTruthy()

    const attempt = await request(app)
      .delete(`/api/v1/auth/sessions/${otherSessionId}`)
      .set('Authorization', `Bearer ${mine.body.data.accessToken}`)
    expect(attempt.status).toBe(400)

    const stillThere = await prisma.refreshToken.findUnique({ where: { id: otherSessionId! } })
    expect(stillThere?.revokedAt).toBeNull()
  })

  it('revokes other devices but keeps the current one', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const keepMe = login.body.data.refreshToken
    const second = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ refreshToken: second.body.data.refreshToken })
    expect(res.status).toBe(204)

    // Verify revocation in the database rather than replaying the dead token:
    // a replay is treated as theft and would (correctly) kill the session we
    // are trying to keep alive.
    const revoked = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(second.body.data.refreshToken) },
      select: { revokedAt: true },
    })
    expect(revoked?.revokedAt).toBeTruthy()

    // The untouched session still works.
    const alive = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: keepMe })
    expect(alive.status).toBe(200)
  })

  it('lets a user edit their own profile but never their role or email', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const token = login.body.data.accessToken

    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed Student', phone: '+92 300 1234567', role: 'ADMIN', email: 'hacked@test.pk' })

    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Renamed Student')

    const stored = await prisma.user.findUnique({ where: { id: userId } })
    expect(stored?.role).toBe('STUDENT')
    expect(stored?.email).toBe(EMAIL)
  })

  it('rejects profile edits with no fields', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const res = await request(app)
      .patch('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({})
    expect(res.status).toBe(400)
  })
})

describe('security: audit trail', () => {
  it('is admin-only', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
    expect(res.status).toBe(403)
  })

  it('returns paginated entries to an admin', async () => {
    const admin = await prisma.user.create({
      data: {
        email: `sec-audit-${Date.now()}@test.pk`,
        passwordHash: await hashPassword(PASSWORD),
        role: 'ADMIN',
        name: 'Audit Admin',
      },
    })
    try {
      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: admin.email, password: PASSWORD })
      const res = await request(app)
        .get('/api/v1/admin/audit-logs?page=1&limit=5')
        .set('Authorization', `Bearer ${login.body.data.accessToken}`)

      expect(res.status).toBe(200)
      expect(res.body.meta).toMatchObject({ page: 1, limit: 5 })
      expect(res.body.data.length).toBeLessThanOrEqual(5)
      expect(res.body.data[0]).toHaveProperty('action')
    } finally {
      await prisma.user.delete({ where: { id: admin.id } })
    }
  })
})
