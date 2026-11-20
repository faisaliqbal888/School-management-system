import { Router } from 'express'
import { asyncHandler } from '../utils/async-handler.js'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rate-limit.js'
import { ok, noContent } from '../utils/response.js'
import { badRequest, unauthorized } from '../utils/errors.js'
import {
  clearAuthCookies,
  readRefreshToken,
  setAuthCookies,
} from '../utils/cookies.js'
import { accessExpiryMs, refreshExpiryMs } from '../utils/jwt.js'
import { changePasswordSchema, loginSchema, type ChangePasswordInput } from '../validators/auth.validator.js'
import * as authService from '../services/auth.service.js'
import { prisma } from '../config/prisma.js'
import { hashPassword, verifyPassword } from '../utils/password.js'

export const authRouter = Router()

// ─────────────────────────────────────────────────────────────
//  POST /auth/login
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/login',
  authLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string }
    const { user, tokens } = await authService.login(email, password, req)

    setAuthCookies(res, tokens, accessExpiryMs(), refreshExpiryMs())
    ok(res, {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /auth/refresh  — rotate the refresh token
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/refresh',
  asyncHandler(async (req, res) => {
    const raw = readRefreshToken(req)
    if (!raw) throw unauthorized('No refresh token supplied')

    const tokens = await authService.refresh(raw, req)
    setAuthCookies(res, tokens, accessExpiryMs(), refreshExpiryMs())

    ok(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /auth/logout
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.id, readRefreshToken(req))
    clearAuthCookies(res)
    noContent(res)
  }),
)

// ─────────────────────────────────────────────────────────────
//  GET /auth/me  — current session
// ─────────────────────────────────────────────────────────────
authRouter.get(
  '/auth/me',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, { user: await authService.sessionFor(req.user!.id) })
  }),
)

// ─────────────────────────────────────────────────────────────
//  POST /auth/change-password
// ─────────────────────────────────────────────────────────────
authRouter.post(
  '/auth/change-password',
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as ChangePasswordInput
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) throw unauthorized('Account no longer exists')

    const currentOk = await verifyPassword(body.currentPassword, user.passwordHash)
    if (!currentOk) throw badRequest('Current password is incorrect')

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(body.newPassword) },
      }),
      // Changing the password signs out every other device.
      prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
      prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'auth.change_password',
          entity: 'User',
          entityId: user.id,
          ipAddress: req.ip,
        },
      }),
    ])

    clearAuthCookies(res)
    ok(res, { message: 'Password changed. Please sign in again.' })
  }),
)
