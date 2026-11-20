import type { Request, Response } from 'express'
import { config } from '../config/env.js'

/**
 * Auth cookies.
 *
 * The access token is also returned in the JSON body (mobile / API clients),
 * but browsers get both tokens as httpOnly cookies so JavaScript — and
 * therefore any XSS payload — can never read them.
 */
export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'
export const REFRESH_COOKIE_PATH = `${config.apiPrefix}/auth`

const base = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax' as const,
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  accessMaxAgeMs: number,
  refreshMaxAgeMs: number,
): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...base,
    path: '/',
    maxAge: accessMaxAgeMs,
  })
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    path: REFRESH_COOKIE_PATH,
    maxAge: refreshMaxAgeMs,
  })
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: '/' })
  res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_COOKIE_PATH })
}

export function readRefreshToken(req: Request): string | null {
  const fromCookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[REFRESH_COOKIE]
  if (fromCookie) return fromCookie
  const body = (req.body as { refreshToken?: unknown } | undefined)?.refreshToken
  return typeof body === 'string' && body.length > 0 ? body : null
}
