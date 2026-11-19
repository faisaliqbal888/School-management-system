import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken, type Role } from '../utils/jwt.js'
import { forbidden, unauthorized } from '../utils/errors.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; email: string }
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) return header.slice(7).trim()

  // Fallback: httpOnly cookie set by /auth/login (preferred for browsers)
  const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token']
  return cookie ?? null
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req)
  if (!token) return next(unauthorized('Missing access token'))

  try {
    const payload = verifyAccessToken(token)
    req.user = { id: payload.sub, role: payload.role, email: payload.email }
    next()
  } catch {
    next(unauthorized('Access token is invalid or has expired'))
  }
}

/** Role guard. Must be used after `authenticate`. */
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized())
    if (roles.length && !roles.includes(req.user.role)) {
      return next(forbidden(`This endpoint requires one of: ${roles.join(', ')}`))
    }
    next()
  }
}
