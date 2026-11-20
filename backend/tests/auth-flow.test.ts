import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'

const app = createApp()

const EMAIL = `flow-${Date.now()}@test.pk`
const PASSWORD = 'FlowTest123'
let userId = ''

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: EMAIL,
      passwordHash: await hashPassword(PASSWORD),
      role: 'ADMIN',
      name: 'Flow Test',
    },
  })
  userId = user.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: EMAIL } })
  await prisma.$disconnect()
})

describe('auth flow', () => {
  it('signs in and returns a session user with httpOnly cookies', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })

    expect(res.status).toBe(200)
    expect(res.body.data.user).toMatchObject({ email: EMAIL, role: 'ADMIN' })
    expect(res.body.data.accessToken).toBeTruthy()

    const cookies = res.headers['set-cookie'] as unknown as string[]
    expect(cookies.some((c) => c.startsWith('access_token=') && c.includes('HttpOnly'))).toBe(true)
    expect(cookies.some((c) => c.startsWith('refresh_token=') && c.includes('HttpOnly'))).toBe(true)
  })

  it('rejects a bad password with a generic message', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: 'nope' })
    expect(res.status).toBe(401)
    expect(res.body.error.message).toBe('Invalid email or password')
  })

  it('rotates the refresh token and blocks reuse', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const first = login.body.data.refreshToken

    const rotated = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: first })
    expect(rotated.status).toBe(200)
    expect(rotated.body.data.refreshToken).not.toBe(first)

    const reuse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: first })
    expect(reuse.status).toBe(401)
    expect(reuse.body.error.message).toMatch(/already been used/i)
  })

  it('GET /auth/me works with the access token and 401s without it', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const token = login.body.data.accessToken

    const okRes = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`)
    expect(okRes.status).toBe(200)
    expect(okRes.body.data.user.email).toBe(EMAIL)

    const anon = await request(app).get('/api/v1/auth/me')
    expect(anon.status).toBe(401)
  })

  it('logout revokes the refresh token', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const { accessToken, refreshToken } = login.body.data

    const out = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
    expect(out.status).toBe(204)

    const after = await request(app).post('/api/v1/auth/refresh').send({ refreshToken })
    expect(after.status).toBe(401)
  })

  it('change-password rejects a weak new password', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({ email: EMAIL, password: PASSWORD })
    const res = await request(app)
      .post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`)
      .send({ currentPassword: PASSWORD, newPassword: 'weak', confirmPassword: 'weak' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('cleans up the test user', async () => {
    expect(userId).toBeTruthy()
  })
})
