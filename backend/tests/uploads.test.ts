import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import request from 'supertest'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createApp } from '../src/app.js'
import { prisma } from '../src/config/prisma.js'
import { hashPassword } from '../src/utils/password.js'
import { sniffImageExtension } from '../src/middleware/upload.js'

/**
 * Avatar uploads.
 *
 * The interesting parts are the rejections: a renamed text file, an oversized
 * image, an empty file. Acceptance alone would pass while the allowlist did
 * nothing.
 */

// The upload directory is read when the app is built, so the env var must be set
// before `createApp()` — hence the app is created in `beforeAll`.
let app: ReturnType<typeof createApp>
const suffix = Date.now().toString().slice(-6)
const PASSWORD = 'TestPass123'

let token = ''
let userId = ''

const TEST_UPLOAD_DIR = path.join(process.cwd(), 'uploads-test')

/** A 1×1 PNG — real magic bytes, tiny enough to keep the test fast. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64',
)

beforeAll(async () => {
  process.env.UPLOAD_DIR = TEST_UPLOAD_DIR
  app = createApp()

  const user = await prisma.user.create({
    data: {
      email: `upload-${suffix}@test.pk`,
      passwordHash: await hashPassword(PASSWORD),
      role: 'STUDENT',
      name: 'Upload Learner',
    },
  })
  userId = user.id

  const login = await request(app).post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD })
  token = login.body.data.accessToken
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: userId } })
  await rm(TEST_UPLOAD_DIR, { recursive: true, force: true })
  await prisma.$disconnect()
})

describe('image sniffing', () => {
  it('recognises real PNG / JPEG / WebP headers', () => {
    expect(sniffImageExtension(PNG)).toBe('png')
    expect(sniffImageExtension(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe('jpg')
    const webp = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.from([0, 0, 0, 0]),
      Buffer.from('WEBP'),
    ])
    expect(sniffImageExtension(webp)).toBe('webp')
  })

  it('rejects anything else, including an HTML file renamed to .png', () => {
    expect(sniffImageExtension(Buffer.from('<!DOCTYPE html><html>'))).toBeNull()
    expect(sniffImageExtension(Buffer.from('short'))).toBeNull()
  })
})

describe('POST /uploads/avatar', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/uploads/avatar').attach('avatar', PNG, 'me.png')
    expect(res.status).toBe(401)
  })

  it('stores a valid image and returns its URL', async () => {
    const res = await request(app)
      .post('/api/v1/uploads/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', PNG, 'me.png')

    expect(res.status).toBe(200)
    expect(res.body.data.url).toBe(`/uploads/avatars/${userId}.png`)

    const stored = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } })
    expect(stored?.avatarUrl).toBe(res.body.data.url)
  })

  it('serves the stored file back', async () => {
    const res = await request(app).get(`/uploads/avatars/${userId}.png`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('image/png')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })

  it('refuses a text file dressed up as an image', async () => {
    const res = await request(app)
      .post('/api/v1/uploads/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('not really a png'), { filename: 'fake.png', contentType: 'image/png' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/not a valid/i)
  })

  it('refuses an unlisted mime type before buffering', async () => {
    const res = await request(app)
      .post('/api/v1/uploads/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', Buffer.from('<svg/>'), { filename: 'x.svg', contentType: 'image/svg+xml' })

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/PNG, JPEG or WebP/i)
  })

  it('refuses an oversized image', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(3 * 1024 * 1024)])
    const res = await request(app)
      .post('/api/v1/uploads/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('avatar', big, 'big.png')

    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/2 MB/i)
  })

  it('refuses a request with no file', async () => {
    const res = await request(app).post('/api/v1/uploads/avatar').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(400)
  })

  it('clears the avatar and removes the file', async () => {
    const res = await request(app).delete('/api/v1/uploads/avatar').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)

    const stored = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } })
    expect(stored?.avatarUrl).toBeNull()

    const gone = await request(app).get(`/uploads/avatars/${userId}.png`)
    expect(gone.status).toBe(404)
  })
})
