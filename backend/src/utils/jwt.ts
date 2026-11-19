import jwt, { type SignOptions } from 'jsonwebtoken'
import { createHash, randomBytes } from 'node:crypto'
import { config } from '../config/env.js'

export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT'

export interface AccessTokenPayload {
  sub: string
  role: Role
  email: string
}

export interface RefreshTokenPayload {
  sub: string
  jti: string
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as SignOptions)
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload
}

/**
 * Refresh tokens are opaque random strings. Only their SHA-256 hash is stored,
 * so a database leak cannot be replayed against the API.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString('base64url')
  return { token, tokenHash: hashToken(token) }
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function refreshExpiryDate(): Date {
  const raw = config.jwt.refreshExpiresIn
  const match = /^(\d+)([smhd])$/.exec(raw)
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const [, amountRaw, unit] = match
  const amount = Number(amountRaw)
  const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return new Date(Date.now() + amount * (ms[unit as string] ?? 86_400_000))
}
