import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { config } from '../src/config/env.js'
import { hashPassword } from '../src/utils/password.js'
import { deliver, isChannelEnabled, summarise } from '../src/services/delivery.service.js'

/**
 * Outbound email/SMS.
 *
 * The provider is stubbed at the `fetch` boundary — these tests assert the
 * contract we rely on (what we send, how failures are reported, and that a
 * provider outage never breaks composing a notice) without any network.
 */

const app = createApp()
const suffix = Date.now().toString().slice(-6)
const PASSWORD = 'TestPass123'

let adminToken = ''
let adminEmail = ''
let createdUserId = ''
let studentUserId = ''
let studentId = ''
const createdNotificationIds: string[] = []

const originalFetch = globalThis.fetch

function stubFetch(handler: (url: string, init: RequestInit) => Promise<Response>) {
  const spy = vi.fn(handler)
  globalThis.fetch = spy as unknown as typeof fetch
  return spy
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeAll(async () => {
  const passwordHash = await hashPassword(PASSWORD)
  adminEmail = `deliv-admin-${suffix}@test.pk`
  const admin = await prisma.user.create({
    data: { email: adminEmail, passwordHash, role: 'ADMIN', name: 'Delivery Admin' },
  })
  createdUserId = admin.id

  // A learner with a guardian phone, so the STUDENT/PARENT audiences actually
  // resolve to recipients. CI starts from an empty database (no seed).
  const studentUser = await prisma.user.create({
    data: {
      email: `deliv-student-${suffix}@test.pk`,
      passwordHash,
      role: 'STUDENT',
      name: 'Delivery Student',
    },
  })
  studentUserId = studentUser.id

  const learner = await prisma.student.create({
    data: {
      userId: studentUser.id,
      admissionNo: `DEL-${suffix}`,
      dateOfBirth: new Date('2010-04-02'),
      gender: 'MALE',
      admissionDate: new Date('2024-04-01'),
      status: 'ACTIVE',
      guardians: {
        create: {
          name: 'Delivery Guardian',
          relation: 'Father',
          phone: '+92 300 1112223',
          isPrimary: true,
        },
      },
    },
  })
  studentId = learner.id

  const login = await request(app).post('/api/v1/auth/login').send({ email: adminEmail, password: PASSWORD })
  adminToken = login.body.data.accessToken
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.restoreAllMocks()
})

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { id: { in: createdNotificationIds } } })
  // Deleting the student cascades to guardians and enrolments.
  if (studentId) await prisma.student.deleteMany({ where: { id: studentId } })
  await prisma.user.deleteMany({ where: { id: { in: [createdUserId, studentUserId].filter(Boolean) } } })
  await prisma.$disconnect()
})

describe('delivery service', () => {
  it('is disabled by default, so nothing is sent', () => {
    expect(config.delivery.enabled).toBe(false)
    expect(isChannelEnabled('EMAIL')).toBe(false)
    expect(isChannelEnabled('SMS')).toBe(false)
  })

  it('returns an empty result when the channel is switched off', async () => {
    const spy = stubFetch(async () => jsonResponse({ id: 'x' }))
    const results = await deliver('EMAIL', [{ to: 'a@test.pk', text: 'hello' }])
    expect(results).toEqual([])
    expect(spy).not.toHaveBeenCalled()
  })

  it('summarises outcomes', () => {
    expect(
      summarise([
        { channel: 'EMAIL', to: 'a', ok: true },
        { channel: 'EMAIL', to: 'b', ok: false, detail: 'boom' },
      ]),
    ).toEqual({ attempted: 2, sent: 1, failed: 1 })
  })
})

describe('composing a notice with an outbound channel', () => {
  async function compose(channel: 'EMAIL' | 'SMS', audience = 'STUDENTS') {
    const res = await request(app)
      .post('/api/v1/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Fee reminder', body: 'Please clear the November dues.', audience, channel })
    if (res.status === 201) createdNotificationIds.push(res.body.data.id)
    return res
  }

  it('saves the in-app notice and reports zero sends while delivery is off', async () => {
    const res = await compose('EMAIL')
    expect(res.status).toBe(201)
    expect(res.body.data.id).toBeTruthy()
    expect(res.body.data.delivery).toMatchObject({ attempted: 0, sent: 0, failed: 0, channels: [] })
  })

  it('keeps the notice even when the provider fails', async () => {
    // Turn delivery on for this test only by patching the resolved config.
    const delivery = config.delivery as unknown as {
      enabled: boolean
      emailUrl?: string
      apiKey?: string
    }
    const before = { ...delivery }
    delivery.enabled = true
    delivery.emailUrl = 'https://mail.example.test/send'

    stubFetch(async () => new Response('upstream exploded', { status: 500 }))

    try {
      const res = await compose('EMAIL')
      expect(res.status).toBe(201)
      expect(res.body.data.id).toBeTruthy()
      // The notice exists; the failure is reported, not thrown.
      const stored = await prisma.notification.findUnique({ where: { id: res.body.data.id } })
      expect(stored).not.toBeNull()
      expect(res.body.data.delivery.failed).toBeGreaterThan(0)
    } finally {
      Object.assign(delivery, before)
    }
  })

  it('posts the expected payload to the provider on success', async () => {
    const delivery = config.delivery as unknown as { enabled: boolean; emailUrl?: string }
    const before = { ...delivery }
    delivery.enabled = true
    delivery.emailUrl = 'https://mail.example.test/send'

    const spy = stubFetch(async () => jsonResponse({ id: 'msg_123' }))

    try {
      const res = await compose('EMAIL')
      expect(res.status).toBe(201)
      expect(spy).toHaveBeenCalled()

      const [url, init] = spy.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('https://mail.example.test/send')
      expect(init.method).toBe('POST')

      const payload = JSON.parse(String(init.body)) as Record<string, unknown>
      expect(payload).toMatchObject({
        from: config.delivery.fromEmail,
        subject: 'Fee reminder',
        text: 'Please clear the November dues.',
      })
      expect(typeof payload.to).toBe('string')
    } finally {
      Object.assign(delivery, before)
    }
  })

  it('never sends SMS to an empty recipient list', async () => {
    const delivery = config.delivery as unknown as { enabled: boolean; smsUrl?: string }
    const before = { ...delivery }
    delivery.enabled = true
    delivery.smsUrl = 'https://sms.example.test/send'

    const spy = stubFetch(async () => jsonResponse({ id: 'sms_1' }))
    try {
      // A brand-new teacher audience has no guardian phones attached to it.
      const res = await request(app)
        .post('/api/v1/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Staff meeting', body: 'Tomorrow at 8am sharp.', audience: 'TEACHERS', channel: 'SMS' })
      if (res.status === 201) createdNotificationIds.push(res.body.data.id)

      expect(res.status).toBe(201)
      expect(res.body.data.delivery.attempted).toBe(0)
      expect(spy).not.toHaveBeenCalled()
    } finally {
      Object.assign(delivery, before)
    }
  })
})
