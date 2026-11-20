import { describe, expect, it } from 'vitest'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { config } from '../src/config/env.js'

const app = createApp()

function token(role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT', sub = 'test-user') {
  return jwt.sign({ sub, role, email: `${role.toLowerCase()}@test.pk` }, config.jwt.accessSecret, {
    expiresIn: '5m',
  })
}

describe('authentication & authorisation', () => {
  it('rejects a request without a token', async () => {
    const res = await request(app).get('/api/v1/academic-years')
    expect(res.status).toBe(401)
  })

  it('rejects a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/academic-years')
      .set('Authorization', 'Bearer not-a-real-token')
    expect(res.status).toBe(401)
  })

  it('rejects an expired token', async () => {
    const expired = jwt.sign(
      { sub: 'x', role: 'ADMIN', email: 'a@b.pk' },
      config.jwt.accessSecret,
      { expiresIn: '-1h' },
    )
    const res = await request(app)
      .get('/api/v1/academic-years')
      .set('Authorization', `Bearer ${expired}`)
    expect(res.status).toBe(401)
  })

  it('blocks a TEACHER from creating a class (RBAC)', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${token('TEACHER')}`)
      .send({ name: 'Grade 11', level: 11, academicYearId: 'x' })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('validates the body for an authorised role', async () => {
    const res = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${token('ADMIN')}`)
      .send({})
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
    expect(Array.isArray(res.body.error.details)).toBe(true)
    expect(res.body.error.details.length).toBeGreaterThan(0)
  })
})
