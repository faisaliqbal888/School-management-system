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

/** "15m" → 900000 · "7d" → 604800000 · malformed → fallback */
export function parseDurationMs(raw: string, fallbackMs: number): number {
  const match = /^(\d+)\s*([smhd])$/.exec(raw.trim())
  if (!match) return fallbackMs
  const amount = Number(match[1])
  const unitMs: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return amount * (unitMs[match[2] as string] ?? fallbackMs)
}

export function accessExpiryMs(): number {
  return parseDurationMs(config.jwt.accessExpiresIn, 15 * 60 * 1000)
}

export function refreshExpiryMs(): number {
  return parseDurationMs(config.jwt.refreshExpiresIn, 7 * 24 * 60 * 60 * 1000)
}

export function refreshExpiryDate(): Date {
  return new Date(Date.now() + refreshExpiryMs())
}
