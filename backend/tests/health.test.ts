import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

/**
 * These tests exercise the app factory without binding a port.
 * The readiness probe is the only one that needs a live database; it is
 * asserted to answer *something* deterministic (200 or 503) rather than
 * requiring Postgres in CI.
 */
const app = createApp()

async function request(path: string, init?: RequestInit) {
  // supertest-free smoke test: use the app through a tiny adapter
  const { default: request } = await import('supertest')
  return request(app)[init?.method === 'POST' ? 'post' : 'get'](path)
}

describe('health endpoints', () => {
  it('GET /api/v1/health returns ok', async () => {
    const res = await request('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.status).toBe('ok')
    expect(typeof res.body.data.uptime).toBe('number')
  })

  it('GET /api/v1/health/ready reports database status', async () => {
    const res = await request('/api/v1/health/ready')
    expect([200, 503]).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.data.database.status).toBe('up')
    } else {
      expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE')
    }
  })

  it('unknown routes return the error envelope', async () => {
    const res = await request('/api/v1/this-does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    })
  })

  it('protected routes reject missing tokens', async () => {
    const res = await request('/api/v1/classes')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })
})
