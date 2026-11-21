import type { NextFunction, Request, Response } from 'express'
import { randomBytes } from 'node:crypto'
import { config } from '../config/env.js'
import { forbidden } from '../utils/errors.js'

/**
 * CSRF protection for cookie-authenticated requests.
 *
 * SameSite=Lax already blocks most cross-site form posts, but it is not a
 * complete defence (older browsers, sub-domain attackers, `<a target>` style
 * navigations that still count as "safe" methods). This applies the standard
 * double-submit pattern:
 *
 *   1. `GET /api/v1/auth/csrf` sets a readable `csrf_token` cookie.
 *   2. The SPA echoes its value in the `X-CSRF-Token` header on every
 *      state-changing request.
 *   3. The server compares header to cookie.
 *
 * A cross-site attacker can make the browser *send* the cookie but cannot read
 * it, so it cannot forge the matching header.
 *
 * Requests that authenticate with a Bearer token instead of a cookie are
 * exempt: browsers do not attach those automatically.
 */

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
export const CSRF_COOKIE = 'csrf_token'
export const CSRF_HEADER = 'x-csrf-token'

/** Issues a fresh token if the caller does not already have one. */
export function issueCsrfToken(req: Request, res: Response, force = false): string {
  const existing = req.cookies?.[CSRF_COOKIE] as string | undefined
  if (existing && !force) return existing

  const token = randomBytes(32).toString('base64url')
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false, // the SPA must be able to read it and echo it back
    secure: config.isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  return token
}

export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (config.isTest || SAFE_METHODS.has(req.method)) {
    next()
    return
  }

  // Bearer-token clients are not vulnerable to CSRF.
  const authHeader = req.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    next()
    return
  }

  // Unauthenticated state-changing calls (login, refresh, logout) are exempt:
  // there is no ambient credential for an attacker to ride on. The login
  // endpoint is additionally rate-limited and account-locked.
  const hasRefreshCookie = Boolean(req.cookies?.refresh_token)
  if (!hasRefreshCookie) {
    next()
    return
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE] as string | undefined
  const headerToken = req.get(CSRF_HEADER)

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    next(forbidden('Invalid or missing CSRF token'))
    return
  }

  next()
}
